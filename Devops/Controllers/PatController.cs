namespace Devops.Controllers;

using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Devops.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("API/pat")]
[Authorize]
public class PatController : ControllerBase
{
    private readonly IPatService _pat;
    public PatController(IPatService pat) => _pat = pat;

    /* GitHub DTOs */
    public record StoreGitHubPatRequest(string GitHubPat, string GitHubOwnerRepo);
    public record PatStatusResponse(bool HasGitHubPat);
    public record WebhookSecretResponse(string WebhookSecret);

    /* Azure DTOs */
    public record StoreAzurePatRequest(string AzurePat, string Organization, string Project);
    public record AzurePatStatusResponse(bool HasAzurePat);

    /* ───────────── GitHub ───────────── */

    [HttpPost("github")]
    public async Task<IActionResult> StoreGitHubPat([FromBody] StoreGitHubPatRequest r)
    {
        var uid = GetUserId();
        if (uid == null) return Unauthorized("Invalid user ID.");

        var (ok, err) = await _pat.StoreGitHubPatAsync(uid.Value, r.GitHubPat, r.GitHubOwnerRepo);
        return ok
            ? Ok(new { message = "GitHub PAT stored and validated successfully." })
            : BadRequest(new { message = err ?? "Failed to store GitHub PAT." });
    }

    [HttpGet("github/status")]
    public async Task<IActionResult> GetGitHubPatStatus()
    {
        var uid = GetUserId();
        if (uid == null) return Unauthorized("Invalid user ID.");

        var pat = await _pat.GetDecryptedGitHubPatAsync(uid.Value);
        return Ok(new PatStatusResponse(pat is not null));
    }

    [HttpPost("github/webhook-secret/refresh")]
    public async Task<IActionResult> RefreshWebhookSecret()
    {
        var uid = GetUserId();
        if (uid == null) return Unauthorized("Invalid user ID.");

        var secret = await _pat.RefreshGitHubWebhookSecretAsync(uid.Value);
        return Ok(new WebhookSecretResponse(secret));
    }

    /* ───────────── Azure DevOps ───────────── */

    [HttpPost("azure")]
    public async Task<IActionResult> StoreAzurePat([FromBody] StoreAzurePatRequest r)
    {
        var uid = GetUserId();
        if (uid == null) return Unauthorized("Invalid user ID.");

        var (ok, err) = await _pat.StoreAzurePatAsync(uid.Value, r.AzurePat, r.Organization, r.Project);
        return ok
            ? Ok(new { message = "Azure PAT stored and validated successfully." })
            : BadRequest(new { message = err ?? "Failed to store Azure PAT." });
    }

    [HttpGet("azure/status")]
    public async Task<IActionResult> GetAzurePatStatus()
    {
        var uid = GetUserId();
        if (uid == null) return Unauthorized("Invalid user ID.");

        var pat = await _pat.GetDecryptedAzurePatAsync(uid.Value);
        return Ok(new AzurePatStatusResponse(pat is not null));
    }

    /* ───────────── helpers ───────────── */
    private Guid? GetUserId()
        => Guid.TryParse(User.FindFirstValue("id"), out var id) ? id : null;
}
