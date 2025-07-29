using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

using Devops.Hubs;

[ApiController]
[Route("API/github/webhook")]
[AllowAnonymous]
public class WebhookController : ControllerBase
{
    private readonly IHubContext<WorkflowHub> _hub;
    private readonly ILogger<WebhookController> _logger;
    private readonly byte[] _secretBytes;

    public WebhookController(
        IHubContext<WorkflowHub> hub,
        IConfiguration config,
        ILogger<WebhookController> logger)
    {
        _hub = hub;
        _logger = logger;
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

        if (payload.TryGetProperty("workflow_run", out var run))
        {
            await _hub.Clients.All.SendAsync("ReceiveWorkflowRun", run);
            _logger.LogInformation("Broadcasted workflow_run event to clients.");
        }
        else
        {
            _logger.LogInformation("Received GitHub webhook without workflow_run.");
        }

        return Ok();
    }

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
