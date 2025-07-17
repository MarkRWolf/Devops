// Devops/Controllers/GitHubController.cs
namespace Devops.Controllers;

using Devops.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Devops.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration; // Added for IConfiguration

[ApiController]
[Route("API/github")]
[Authorize]
public class GitHubController(IGitHubService githubService, IPatService patService, IConfiguration configuration) : ControllerBase // IConfiguration added
{
    // Retrieve project-specific GitHub configuration from appsettings.json or user secrets
    private readonly string? _projectOwnerRepo = configuration["GitHub:ProjectOwnerRepo"];
    private readonly string? _projectPat = configuration["GitHub:ProjectPat"];

    private Task<Guid?> GetValidatedUserId()
    {
        var userIdClaim = User.FindFirstValue("id");
        if (!Guid.TryParse(userIdClaim, out var userId)) return Task.FromResult<Guid?>(null);
  
        return Task.FromResult<Guid?>(userId);
    }

    private async Task<bool> CheckPatExists(Guid userId)
    {
        return !string.IsNullOrEmpty(await patService.GetDecryptedGitHubPatAsync(userId));
    }

    // Existing authenticated endpoints for user-specific GitHub data (remain unchanged)
    [HttpGet("workflows/{owner}/{repo}/runs")]
    public async Task<ActionResult<List<GitHubWorkflowRun>>> GetWorkflowRuns(string owner, string repo)
    {
        var userId = await GetValidatedUserId();
        if (!userId.HasValue) return Unauthorized("Invalid user ID.");
        if (!await CheckPatExists(userId.Value)) return BadRequest("GitHub PAT not configured for your account.");
        var runs = await githubService.GetWorkflowRunsAsync(userId.Value, owner, repo);
        if (runs == null) return StatusCode(500, "Failed to retrieve GitHub workflow runs. Please check server logs for details.");
        return Ok(runs);
    }

    [HttpGet("workflows/{owner}/{repo}/runs/{runId}")]
    public async Task<ActionResult<GitHubWorkflowRun>> GetSingleWorkflowRun(string owner, string repo, long runId)
    {
        var userId = await GetValidatedUserId();
        if (!userId.HasValue) return Unauthorized("Invalid user ID.");
        if (!await CheckPatExists(userId.Value)) return BadRequest("GitHub PAT not configured.");
        var run = await githubService.GetSingleWorkflowRunAsync(userId.Value, owner, repo, runId);
        if (run == null) return NotFound($"Workflow run with ID {runId} not found or failed to retrieve for {owner}/{repo}.");
        return Ok(run);
    }

    [HttpGet("workflows/{owner}/{repo}/runs/{runId}/jobs")]
    public async Task<ActionResult<List<GitHubJob>>> GetWorkflowRunJobs(string owner, string repo, long runId)
    {
        var userId = await GetValidatedUserId();
        if (!userId.HasValue) return Unauthorized("Invalid user ID.");
        if (!await CheckPatExists(userId.Value)) return BadRequest("GitHub PAT not configured.");
        var jobs = await githubService.GetWorkflowRunJobsAsync(userId.Value, owner, repo, runId);
        if (jobs == null) return StatusCode(500, $"Failed to retrieve workflow jobs for {owner}/{repo}/{runId}.");
        return Ok(jobs);
    }

    [HttpGet("workflows/{owner}/{repo}/runs/{runId}/logs")]
    public async Task<ActionResult> DownloadWorkflowRunLogs(string owner, string repo, long runId)
    {
        var userId = await GetValidatedUserId();
        if (!userId.HasValue) return Unauthorized("Invalid user ID.");
        if (!await CheckPatExists(userId.Value)) return BadRequest("GitHub PAT not configured.");
        var fileContent = await githubService.DownloadWorkflowRunLogsAsync(userId.Value, owner, repo, runId);
        if (fileContent == null) return NotFound($"Logs for workflow run ID {runId} not found or failed to retrieve for {owner}/{repo}.");
        return File(fileContent.Content, fileContent.ContentType, fileContent.FileName);
    }

    [HttpGet("workflows/{owner}/{repo}/runs/{runId}/artifacts")]
    public async Task<ActionResult<List<GitHubArtifact>>> GetWorkflowRunArtifacts(string owner, string repo, long runId)
    {
        var userId = await GetValidatedUserId();
        if (!userId.HasValue) return Unauthorized("Invalid user ID.");
        if (!await CheckPatExists(userId.Value)) return BadRequest("GitHub PAT not configured.");
        var artifacts = await githubService.GetWorkflowRunArtifactsAsync(userId.Value, owner, repo, runId);
        if (artifacts == null) return StatusCode(500, $"Failed to retrieve workflow artifacts for {owner}/{repo}/{runId}.");
        return Ok(artifacts);
    }

    [HttpGet("workflows/{owner}/{repo}/artifacts/{artifactId}/zip")]
    public async Task<ActionResult> DownloadSpecificArtifact(string owner, string repo, long artifactId)
    {
        var userId = await GetValidatedUserId();
        if (!userId.HasValue) return Unauthorized("Invalid user ID.");
        if (!await CheckPatExists(userId.Value)) return BadRequest("GitHub PAT not configured.");
        var fileContent = await githubService.DownloadSpecificArtifactAsync(userId.Value, owner, repo, artifactId);
        if (fileContent == null) return NotFound($"Artifact with ID {artifactId} not found or failed to retrieve for {owner}/{repo}.");
        return File(fileContent.Content, fileContent.ContentType, fileContent.FileName);
    }

    // New anonymous endpoints for project-specific GitHub data
    [AllowAnonymous]
    [HttpGet("project/workflows/runs")]
    public async Task<ActionResult<List<GitHubWorkflowRun>>> GetProjectWorkflowRuns()
    {
        if (string.IsNullOrEmpty(_projectOwnerRepo) || string.IsNullOrEmpty(_projectPat))
        {
            return StatusCode(503, "GitHub project owner/repository or PAT is not configured on the server. Please check appsettings.json or user secrets.");
        }

        var parts = _projectOwnerRepo.Split('/');
        if (parts.Length != 2) return StatusCode(500, "Invalid GitHub:ProjectOwnerRepo format in server configuration. Expected 'owner/repo'.");

        var owner = parts[0];
        var repo = parts[1];

        var runs = await githubService.GetWorkflowRunsWithPatAsync(owner, repo, _projectPat);
        if (runs == null) return StatusCode(500, "Failed to retrieve project GitHub workflow runs. Please check server logs for details.");
        return Ok(runs);
    }

    [AllowAnonymous]
    [HttpGet("project/workflows/runs/{runId}")]
    public async Task<ActionResult<GitHubWorkflowRun>> GetSingleProjectWorkflowRun(long runId)
    {
        if (string.IsNullOrEmpty(_projectOwnerRepo) || string.IsNullOrEmpty(_projectPat))
        {
            return StatusCode(503, "GitHub project owner/repository or PAT is not configured on the server.");
        }

        var parts = _projectOwnerRepo.Split('/');
        if (parts.Length != 2) return StatusCode(500, "Invalid GitHub:ProjectOwnerRepo format in server configuration. Expected 'owner/repo'.");

        var owner = parts[0];
        var repo = parts[1];

        var run = await githubService.GetSingleWorkflowRunWithPatAsync(owner, repo, runId, _projectPat);
        if (run == null) return NotFound($"Workflow run with ID {runId} not found or failed to retrieve for project {_projectOwnerRepo}.");
        return Ok(run);
    }

    [AllowAnonymous]
    [HttpGet("project/workflows/runs/{runId}/jobs")]
    public async Task<ActionResult<List<GitHubJob>>> GetProjectWorkflowRunJobs(long runId)
    {
        if (string.IsNullOrEmpty(_projectOwnerRepo) || string.IsNullOrEmpty(_projectPat))
        {
            return StatusCode(503, "GitHub project owner/repository or PAT is not configured on the server.");
        }

        var parts = _projectOwnerRepo.Split('/');
        if (parts.Length != 2) return StatusCode(500, "Invalid GitHub:ProjectOwnerRepo format in server configuration. Expected 'owner/repo'.");

        var owner = parts[0];
        var repo = parts[1];

        var jobs = await githubService.GetWorkflowRunJobsWithPatAsync(owner, repo, runId, _projectPat);
        if (jobs == null) return StatusCode(500, $"Failed to retrieve project workflow jobs for {_projectOwnerRepo}/{runId}.");
        return Ok(jobs);
    }

    [AllowAnonymous]
    [HttpGet("project/workflows/runs/{runId}/logs")]
    public async Task<ActionResult> DownloadProjectWorkflowRunLogs(long runId)
    {
        if (string.IsNullOrEmpty(_projectOwnerRepo) || string.IsNullOrEmpty(_projectPat))
        {
            return StatusCode(503, "GitHub project owner/repository or PAT is not configured on the server.");
        }

        var parts = _projectOwnerRepo.Split('/');
        if (parts.Length != 2) return StatusCode(500, "Invalid GitHub:ProjectOwnerRepo format in server configuration. Expected 'owner/repo'.");

        var owner = parts[0];
        var repo = parts[1];

        var fileContent = await githubService.DownloadWorkflowRunLogsWithPatAsync(owner, repo, runId, _projectPat);
        if (fileContent == null) return NotFound($"Logs for project workflow run ID {runId} not found or failed to retrieve for {_projectOwnerRepo}.");
        return File(fileContent.Content, fileContent.ContentType, fileContent.FileName);
    }

    [AllowAnonymous]
    [HttpGet("project/workflows/runs/{runId}/artifacts")]
    public async Task<ActionResult<List<GitHubArtifact>>> GetProjectWorkflowRunArtifacts(long runId)
    {
        if (string.IsNullOrEmpty(_projectOwnerRepo) || string.IsNullOrEmpty(_projectPat))
        {
            return StatusCode(503, "GitHub project owner/repository or PAT is not configured on the server.");
        }

        var parts = _projectOwnerRepo.Split('/');
        if (parts.Length != 2) return StatusCode(500, "Invalid GitHub:ProjectOwnerRepo format in server configuration. Expected 'owner/repo'.");

        var owner = parts[0];
        var repo = parts[1];

        var artifacts = await githubService.GetWorkflowRunArtifactsWithPatAsync(owner, repo, runId, _projectPat);
        if (artifacts == null) return StatusCode(500, $"Failed to retrieve project workflow artifacts for {_projectOwnerRepo}/{runId}.");
        return Ok(artifacts);
    }

    [AllowAnonymous]
    [HttpGet("project/workflows/artifacts/{artifactId}/zip")]
    public async Task<ActionResult> DownloadSpecificProjectArtifact(long artifactId)
    {
        if (string.IsNullOrEmpty(_projectOwnerRepo) || string.IsNullOrEmpty(_projectPat))
        {
            return StatusCode(503, "GitHub project owner/repository or PAT is not configured on the server.");
        }

        var parts = _projectOwnerRepo.Split('/');
        if (parts.Length != 2) return StatusCode(500, "Invalid GitHub:ProjectOwnerRepo format in server configuration. Expected 'owner/repo'.");

        var owner = parts[0];
        var repo = parts[1];

        var fileContent = await githubService.DownloadSpecificArtifactWithPatAsync(owner, repo, artifactId, _projectPat);
        if (fileContent == null) return NotFound($"Project artifact with ID {artifactId} not found or failed to retrieve for {_projectOwnerRepo}.");
        return File(fileContent.Content, fileContent.ContentType, fileContent.FileName);
    }
}