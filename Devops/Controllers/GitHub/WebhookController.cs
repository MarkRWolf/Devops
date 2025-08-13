using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Devops.Data;
using Devops.Hubs;
using Devops.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Devops.Controllers.GitHub
{
    [ApiController]
    [Route("API/github/webhook")]
    [AllowAnonymous]
    public class WebhookController : ControllerBase
    {
        private readonly IHubContext<WorkflowHub> _hub;
        private readonly ILogger<WebhookController> _logger;
        private readonly DevopsDb _db;
        private readonly IPatService _patService;
        private readonly IMemoryCache _cache;
        private readonly byte[] _projectSecretBytes;
        private readonly string? _projectOwnerRepo;

        public WebhookController(
            IHubContext<WorkflowHub> hub,
            IConfiguration cfg,
            ILogger<WebhookController> logger,
            DevopsDb db,
            IPatService patService,
            IMemoryCache cache)
        {
            _hub = hub;
            _logger = logger;
            _db = db;
            _patService = patService;
            _cache = cache;

            _projectOwnerRepo = cfg["GitHub:ProjectOwnerRepo"];
            var projSecret = cfg["GitHub:WebhookSecret"];
            if(string.IsNullOrWhiteSpace(projSecret)) throw new ArgumentNullException("GitHub:WebhookSecret");
            _projectSecretBytes = Encoding.UTF8.GetBytes(projSecret);
        }

        [HttpPost]
        public async Task<IActionResult> Receive(
            [FromHeader(Name = "X-Hub-Signature-256")] string signature)
        {
            string body;
            using (var reader = new StreamReader(Request.Body, Encoding.UTF8, leaveOpen: true))
            {
                body = await reader.ReadToEndAsync();
                Request.Body.Position = 0;
            }

            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;

            if (!root.TryGetProperty("workflow_run", out var run))
            {
                _logger.LogInformation("Webhook payload missing workflow_run - ignored.");
                return Ok();
            }

            string? repoFull = root.GetProperty("repository").GetProperty("full_name").GetString();
            if (string.IsNullOrWhiteSpace(repoFull))
            {
                _logger.LogWarning("repository.full_name missing in webhook payload.");
                return Ok();
            }

            if (string.Equals(repoFull, _projectOwnerRepo, StringComparison.OrdinalIgnoreCase))
            {
                if (!Verify(signature, body, _projectSecretBytes))
                {
                    _logger.LogWarning("Signature mismatch for public webhook.");
                    return Unauthorized();
                }

                _cache.Remove($"runs-{_projectOwnerRepo}");
                await _hub.Clients.Group("demo").SendAsync("ReceiveWorkflowRun", run);
                _logger.LogInformation("Public workflow_run broadcasted to 'demo' group for {Repo}.", repoFull);
                return Ok();
            }

            var users = await _db.Users
                .AsNoTracking()
                .Where(u => u.HasGitHubConfig && u.GitHubOwnerRepo == repoFull)
                .Select(u => u.Id)
                .ToListAsync();

            if (users.Count == 0)
            {
                _logger.LogInformation("No subscribers for repo {Repo}.", repoFull);
                return Ok();
            }

            var delivered = 0;
            foreach (var userId in users)
            {
                var secret = await _patService.GetDecryptedGitHubWebhookSecretAsync(userId);
                if (string.IsNullOrWhiteSpace(secret)) continue;

                var secretBytes = Encoding.UTF8.GetBytes(secret);
                if (!Verify(signature, body, secretBytes)) continue;

                _cache.Remove($"runs-{userId}-{repoFull}");
                await _hub.Clients.Group($"user-{userId}")
                    .SendAsync("ReceiveWorkflowRun", run);
                delivered++;
            }

            _logger.LogInformation("Webhook for {Repo} delivered to {Count} user(s).", repoFull, delivered);
            return Ok();
        }

        private static bool Verify(string signedHeader, string payload, byte[] secret)
        {
            if (string.IsNullOrWhiteSpace(signedHeader) ||
                !signedHeader.StartsWith("sha256=", StringComparison.OrdinalIgnoreCase))
                return false;

            var sig = signedHeader["sha256=".Length..];
            using var hmac = new HMACSHA256(secret);
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
            var computed = BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
            return computed == sig;
        }
    }
}
