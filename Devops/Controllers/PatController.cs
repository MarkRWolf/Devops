using System;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq;
using Devops.Models;
using Devops.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Devops.Controllers;

[ApiController]
[Route("API/pat")]
[Authorize]
public class PatController : ControllerBase
{
    private readonly IPatService _pat;
    private readonly UserManager<DevopsUser> _users;
    private readonly ILogger<PatController> _logger;

    public PatController(
        IPatService pat,
        UserManager<DevopsUser> users,
        ILogger<PatController> logger)
    {
        _pat = pat;
        _users = users;
        _logger = logger;
    }

    public record StoreGitHubPatRequest(string GitHubPat, string GitHubOwnerRepo);
    public record PatStatusResponse(bool HasGitHubPat);
    public record WebhookSecretResponse(string WebhookSecret);

    public record StoreAzurePatRequest(string AzurePat, string Organization, string Project);
    public record AzurePatStatusResponse(bool HasAzurePat);

    [HttpPost("github")]
    public async Task<IActionResult> StoreGitHubPat([FromBody] StoreGitHubPatRequest r)
    {
        var uid = await GetUserId();
        if (uid == null) return Unauthorized("Invalid user.");

        var (ok, err) = await _pat.StoreGitHubPatAsync(uid.Value, r.GitHubPat, r.GitHubOwnerRepo);
        return ok
            ? Ok(new { message = "GitHub PAT stored and validated successfully." })
            : BadRequest(new { message = err ?? "Failed to store GitHub PAT." });
    }

    [HttpGet("github/status")]
    public async Task<IActionResult> GetGitHubPatStatus()
    {
        var uid = await GetUserId();
        if (uid == null) return Unauthorized("Invalid user.");

        var pat = await _pat.GetDecryptedGitHubPatAsync(uid.Value);
        return Ok(new PatStatusResponse(pat is not null));
    }

    [HttpPost("github/webhook-secret/refresh")]
    public async Task<IActionResult> RefreshWebhookSecret()
    {
        var uid = await GetUserId();
        if (uid == null) return Unauthorized("Invalid user.");

        var secret = await _pat.RefreshGitHubWebhookSecretAsync(uid.Value);
        return Ok(new WebhookSecretResponse(secret));
    }

    [HttpPost("azure")]
    public async Task<IActionResult> StoreAzurePat([FromBody] StoreAzurePatRequest r)
    {
        var uid = await GetUserId();
        if (uid == null) return Unauthorized("Invalid user.");

        var (ok, err) = await _pat.StoreAzurePatAsync(uid.Value, r.AzurePat, r.Organization, r.Project);
        return ok
            ? Ok(new { message = "Azure PAT stored and validated successfully." })
            : BadRequest(new { message = err ?? "Failed to store Azure PAT." });
    }

    [HttpGet("azure/status")]
    public async Task<IActionResult> GetAzurePatStatus()
    {
        var uid = await GetUserId();
        if (uid == null) return Unauthorized("Invalid user.");

        var pat = await _pat.GetDecryptedAzurePatAsync(uid.Value);
        return Ok(new AzurePatStatusResponse(pat is not null));
    }

    [HttpPost("azure/webhook-secret/refresh")]
    public async Task<IActionResult> RefreshAzureWebhookSecret()
    {
        var uid = await GetUserId();
        if (uid == null) return Unauthorized("Invalid user.");

        var secret = await _pat.RefreshAzureWebhookSecretAsync(uid.Value);
        return Ok(new { WebhookSecret = secret });
    }

    private async Task<Guid?> GetUserId()
    {
        var sub = User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(sub))
        {
            _logger.LogWarning("PAT: missing 'sub' claim. Claims: {Claims}",
                string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}")));
            return null;
        }

        var user = await _users.Users
            .Where(u => u.HydraSubject == sub)
            .Select(u => new { u.Id })
            .FirstOrDefaultAsync();

        if (user == null)
        {
            _logger.LogWarning("PAT: no DevopsUser found for Hydra sub {Sub}", sub);
            return null;
        }

        return user.Id;
    }
}

