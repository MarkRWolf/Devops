namespace Devops.Controllers;

using Devops.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Devops.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

[ApiController]
[Route("API/github")]
[Authorize]
public class GitHubController(IGitHubService githubService, IPatService patService) : ControllerBase
{
    [HttpGet("workflows/{owner}/{repo}/runs")]
    public async Task<ActionResult<List<GitHubWorkflowRun>>> GetWorkflowRuns(string owner, string repo)
    {
        var userIdClaim = User.FindFirstValue("id");
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized("Invalid user ID.");
        }

        var patExists = await patService.GetDecryptedGitHubPatAsync(userId);
        if (string.IsNullOrEmpty(patExists))
        {
            return BadRequest("GitHub PAT not configured for your account.");
        }

        var runs = await githubService.GetWorkflowRunsAsync(userId, owner, repo);
        if (runs == null)
        {
            return StatusCode(500, "Failed to retrieve GitHub workflow runs. Please check server logs for details.");
        }
        return Ok(runs);
    }
}