namespace Devops.Controllers;

using Devops.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[ApiController]
[Route("API/pat")]
[Authorize]
public class PatController(IPatService patService) : ControllerBase
{
public record StorePatRequest(string GitHubPat, string GitHubOwnerRepo);    public record PatStatusResponse(bool HasGitHubPat);

    [HttpPost("github")]
    public async Task<IActionResult> StoreGitHubPat([FromBody] StorePatRequest request)
    {
        var userIdClaim = User.FindFirstValue("id");
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized("Invalid user ID.");
        }

        var (success, error) = await patService.StoreGitHubPatAsync(userId, request.GitHubPat, request.GitHubOwnerRepo);

        if (!success)
        {
            return BadRequest(new { message = error ?? "Failed to store GitHub PAT." });
        }

        return Ok(new { message = "GitHub PAT stored and validated successfully." });
    }

    [HttpGet("github/status")]
    public async Task<IActionResult> GetGitHubPatStatus()
    {
        var userIdClaim = User.FindFirstValue("id");
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized("Invalid user ID.");
        }

        var pat = await patService.GetDecryptedGitHubPatAsync(userId);
        return Ok(new PatStatusResponse(pat != null));
    }
}