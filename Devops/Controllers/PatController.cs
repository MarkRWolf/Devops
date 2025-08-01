// Controllers/PatController.cs
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
public class PatController(IPatService patService) : ControllerBase
{
    public record StorePatRequest(string GitHubPat, string GitHubOwnerRepo);
    public record PatStatusResponse(bool HasGitHubPat);
    public record WebhookSecretResponse(string WebhookSecret);

    [HttpPost("github")]
    public async Task<IActionResult> StoreGitHubPat([FromBody] StorePatRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized("Invalid user ID.");

        var (success, error) = await patService.StoreGitHubPatAsync(userId.Value, request.GitHubPat, request.GitHubOwnerRepo);
        return success ? Ok(new { message = "GitHub PAT stored and validated successfully." })
                       : BadRequest(new { message = error ?? "Failed to store GitHub PAT." });
    }

    [HttpGet("github/status")]
    public async Task<IActionResult> GetGitHubPatStatus()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized("Invalid user ID.");
        var pat = await patService.GetDecryptedGitHubPatAsync(userId.Value);
        return Ok(new PatStatusResponse(pat != null));
    }

    /* NEW: generate / refresh webhook secret */
    [HttpPost("github/webhook-secret/refresh")]
    public async Task<IActionResult> RefreshWebhookSecret()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized("Invalid user ID.");

        var secret = await patService.RefreshGitHubWebhookSecretAsync(userId.Value);
        return Ok(new WebhookSecretResponse(secret));
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirstValue("id");
        return Guid.TryParse(claim, out var id) ? id : null;
    }
}
