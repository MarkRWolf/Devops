namespace Devops.Controllers.Azure
{
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

    [ApiController]
    [Route("API/azure/webhook")]
    [AllowAnonymous]
    public class AzureWebhookController : ControllerBase
    {
        private readonly IHubContext<WorkflowHub> _hub;
        private readonly ILogger<AzureWebhookController> _log;
        private readonly DevopsDb _db;
        private readonly IPatService _pat;
        private readonly IMemoryCache _cache;
        private readonly string? _projectOrg;
        private readonly string? _projectName;
        private readonly string? _projectSecret;

        public AzureWebhookController(
            IHubContext<WorkflowHub> hub,
            IConfiguration cfg,
            ILogger<AzureWebhookController> log,
            DevopsDb db,
            IPatService pat,
            IMemoryCache cache)
        {
            _hub = hub;
            _log = log;
            _db = db;
            _pat = pat;
            _cache = cache;

            _projectOrg = cfg["Azure:ProjectOrganization"];
            _projectName = cfg["Azure:ProjectName"];
            _projectSecret = cfg["Azure:WebhookSecret"];
        }

        [HttpPost]
        public async Task<IActionResult> Receive()
        {
            if (!Request.Headers.TryGetValue("Authorization", out var authHeader))
                return Unauthorized();

            if (!TryParseBasicAuth(authHeader.ToString(), out var username, out var password))
                return Unauthorized();

            string body;
            using (var reader = new StreamReader(Request.Body, Encoding.UTF8, leaveOpen: true))
            {
                body = await reader.ReadToEndAsync();
                Request.Body.Position = 0;
            }

            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;

            if (!root.TryGetProperty("eventType", out var et)) return Ok();
            var eventType = et.GetString();
            if (string.IsNullOrWhiteSpace(eventType)) return Ok();

            if (!root.TryGetProperty("resource", out var res)) return Ok();

            string? org = null;
            string? project = null;

            if (res.TryGetProperty("url", out var urlEl))
            {
                var url = urlEl.GetString();
                if (!string.IsNullOrWhiteSpace(url))
                {
                    try
                    {
                        var u = new Uri(url);
                        var parts = u.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
                        org = parts.Length > 0 ? parts[0] : null;
                        project ??= parts.Length > 1 ? parts[1] : null;
                    }
                    catch { }
                }
            }

            if (res.TryGetProperty("project", out var projEl) && projEl.TryGetProperty("name", out var projName))
                project ??= projName.GetString();

            if (!string.IsNullOrWhiteSpace(_projectOrg) &&
                !string.IsNullOrWhiteSpace(_projectName) &&
                string.Equals(username, _projectName, StringComparison.OrdinalIgnoreCase) &&
                password == _projectSecret)
            {
                _cache.Remove($"az-builds-{_projectOrg}-{_projectName}");
                await _hub.Clients.Group("demo").SendAsync("ReceiveAzureBuild", res);
                return Ok();
            }

            if (string.IsNullOrWhiteSpace(org) || string.IsNullOrWhiteSpace(project)) return Ok();

            var user = await _db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.HasAzureConfig &&
                                          u.AzureOrganization == org &&
                                          u.AzureProject == username);

            if (user is null) return Ok();

            var secret = await _pat.GetDecryptedAzureWebhookSecretAsync(user.Id);
            if (string.IsNullOrWhiteSpace(secret) || password != secret) return Unauthorized();

            _cache.Remove($"az-builds-{user.Id}");
            await _hub.Clients.Group($"user-{user.Id}").SendAsync("ReceiveAzureBuild", res);
            _log.LogInformation("Azure webhook delivered to user {UserId} for {Org}/{Project}.", user.Id, org, project);
            return Ok();
        }

        private static bool TryParseBasicAuth(string authHeader, out string username, out string password)
        {
            username = password = string.Empty;
            if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Basic ", StringComparison.OrdinalIgnoreCase))
                return false;

            var raw = Encoding.UTF8.GetString(Convert.FromBase64String(authHeader["Basic ".Length..]));
            var parts = raw.Split(':', 2);
            if (parts.Length != 2) return false;
            username = parts[0];
            password = parts[1];
            return true;
        }
    }
}
