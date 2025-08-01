// Controllers/GitHub/WebhookController.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Devops.Data;
using Devops.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

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
        private readonly byte[] _secretBytes;
        private readonly string? _projectOwnerRepo;

        public WebhookController(
            IHubContext<WorkflowHub> hub,
            IConfiguration config,
            ILogger<WebhookController> logger,
            DevopsDb db)
        {
            _hub = hub;
            _logger = logger;
            _db = db;

            _projectOwnerRepo = config["GitHub:ProjectOwnerRepo"];

            var secret = config["GitHub:WebhookSecret"]
                         ?? throw new ArgumentNullException("GitHub:WebhookSecret");
            _secretBytes = Encoding.UTF8.GetBytes(secret);
        }

        [HttpPost]
        public async Task<IActionResult> Receive(
            [FromHeader(Name = "X-Hub-Signature-256")] string signature)
        {
            using var reader = new StreamReader(Request.Body, Encoding.UTF8, leaveOpen: true);
            var rawBody = await reader.ReadToEndAsync();
            Request.Body.Position = 0;

            if (!VerifySignature(signature, rawBody))
            {
                _logger.LogWarning("GitHub webhook signature mismatch.");
                return Unauthorized();
            }

            using var doc = JsonDocument.Parse(rawBody);
            var payload = doc.RootElement;

            if (!payload.TryGetProperty("workflow_run", out var run))
            {
                _logger.LogInformation("Webhook received without workflow_run – ignored.");
                return Ok();
            }

            // Determine repository full name (owner/repo)
            string? repoFullName = null;
            try
            {
                repoFullName = run.GetProperty("repository").GetProperty("full_name").GetString();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Unable to read repository.full_name from webhook payload.");
            }

            if (string.IsNullOrWhiteSpace(repoFullName))
            {
                _logger.LogWarning("No repository.full_name in payload; broadcasting skipped.");
                return Ok();
            }

            // Broadcast to all clients for the public project repo, otherwise target user groups
            if (string.Equals(repoFullName, _projectOwnerRepo, StringComparison.OrdinalIgnoreCase))
            {
                await _hub.Clients.All.SendAsync("ReceiveWorkflowRun", run);
                _logger.LogInformation("Broadcasted public workflow_run for {Repo} to all clients.", repoFullName);
            }
            else
            {
                List<Guid> targetUserIds = await _db.Users
                    .AsNoTracking()
                    .Where(u => u.HasGitHubConfig && u.GitHubOwnerRepo == repoFullName)
                    .Select(u => u.Id)
                    .ToListAsync();

                foreach (var userId in targetUserIds)
                {
                    await _hub.Clients.Group($"user-{userId}")
                        .SendAsync("ReceiveWorkflowRun", run);
                }

                _logger.LogInformation(
                    "Broadcasted workflow_run for {Repo} to {Count} subscribed user(s).",
                    repoFullName, targetUserIds.Count);
            }

            return Ok();
        }

        /* ───────── helpers ───────── */

        private bool VerifySignature(string signatureWithPrefix, string payload)
        {
            if (string.IsNullOrWhiteSpace(signatureWithPrefix) ||
                !signatureWithPrefix.StartsWith("sha256=", StringComparison.OrdinalIgnoreCase))
                return false;

            var signature = signatureWithPrefix["sha256=".Length..];
            using var hmac = new HMACSHA256(_secretBytes);
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
            var computed = BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
            return computed == signature;
        }
    }
}
