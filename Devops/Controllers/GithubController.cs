// Devops/Controllers/GitHubController.cs
namespace Devops.Controllers;

using Devops.Services.Interfaces;
using Devops.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

[ApiController]
[Route("API/github")]
[Authorize]
public class GitHubController(
    IGitHubService githubService,
    IPatService patService,
    IConfiguration configuration,
    ILogger<GitHubController> logger) : ControllerBase
{
    private readonly IGitHubService _githubService = githubService;
    private readonly IPatService _patService = patService;
    private readonly ILogger<GitHubController> _log = logger;

    private readonly string? _projectOwnerRepo = configuration["GitHub:ProjectOwnerRepo"];
    private readonly string? _projectPat = configuration["GitHub:ProjectPat"];

    /* ───────────────── helpers ───────────────── */

    private Task<Guid?> GetValidatedUserId()
    {
        var userIdClaim = User.FindFirstValue("id");
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Task.FromResult<Guid?>(null);

        return Task.FromResult<Guid?>(userId);
    }

    private async Task<bool> CheckPatExists(Guid userId) =>
        !string.IsNullOrEmpty(await _patService.GetDecryptedGitHubPatAsync(userId));

    /* ───────────────── user-auth endpoints ───────────────── */

     [HttpGet("workflows/runs")]
    public async Task<ActionResult<List<GitHubWorkflowRun>>> GetWorkflowRuns()
    {
        var userIdClaim = User.FindFirstValue("id");
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized("Invalid user ID.");

        var (pat, ownerRepo) = await _patService.GetGitHubCredentialsAsync(userId);

        if (string.IsNullOrEmpty(pat) || string.IsNullOrEmpty(ownerRepo))
        {
            return BadRequest("GitHub PAT or Owner/Repo not configured for your account.");
        }

        var parts = ownerRepo.Split('/');
        if (parts.Length != 2)
        {
            return StatusCode(500, "Invalid stored GitHub Owner/Repo format.");
        }
        var owner = parts[0];
        var repo = parts[1];

        var runs = await _githubService.GetWorkflowRunsAsync(userId, owner, repo);
        if (runs == null) return StatusCode(500, "Failed to retrieve GitHub workflow runs. Please check server logs for details.");
        return Ok(runs);
    }


[HttpGet("workflows/runs/{runId}")]
public async Task<ActionResult<GitHubWorkflowRun>> GetWorkflowRun(long runId)
{
    var userIdClaim = User.FindFirstValue("id");
    if (!Guid.TryParse(userIdClaim, out var userId))
        return Unauthorized("Invalid user ID.");

    var (pat, ownerRepo) = await _patService.GetGitHubCredentialsAsync(userId);
    if (string.IsNullOrEmpty(pat) || string.IsNullOrEmpty(ownerRepo))
        return BadRequest("GitHub PAT or Owner/Repo not configured.");

    var split = ownerRepo.Split('/');
    if (split.Length != 2) return StatusCode(500, "Invalid Owner/Repo format.");
    var run = await _githubService.GetSingleWorkflowRunAsync(userId, split[0], split[1], runId);
    return run is null
        ? NotFound($"Run {runId} not found for {ownerRepo}.")
        : Ok(run);
}

[HttpGet("workflows/runs/{runId}/jobs")]
public async Task<ActionResult<List<GitHubJob>>> GetWorkflowRunJobs(long runId)
{
    var userIdClaim = User.FindFirstValue("id");
    if (!Guid.TryParse(userIdClaim, out var userId))
        return Unauthorized("Invalid user ID.");

    var (pat, ownerRepo) = await _patService.GetGitHubCredentialsAsync(userId);
    if (string.IsNullOrEmpty(pat) || string.IsNullOrEmpty(ownerRepo))
        return BadRequest("GitHub PAT or Owner/Repo not configured.");

    var split = ownerRepo.Split('/');
    if (split.Length != 2) return StatusCode(500, "Invalid Owner/Repo format.");
    var jobs = await _githubService.GetWorkflowRunJobsAsync(userId, split[0], split[1], runId);
    return jobs is null
        ? StatusCode(500, $"Failed to retrieve jobs for {ownerRepo}/{runId}.")
        : Ok(jobs);
}

[HttpGet("workflows/runs/{runId}/artifacts")]
public async Task<ActionResult<List<GitHubArtifact>>> GetWorkflowRunArtifacts(long runId)
{
    var userIdClaim = User.FindFirstValue("id");
    if (!Guid.TryParse(userIdClaim, out var userId))
        return Unauthorized("Invalid user ID.");

    var (pat, ownerRepo) = await _patService.GetGitHubCredentialsAsync(userId);
    if (string.IsNullOrEmpty(pat) || string.IsNullOrEmpty(ownerRepo))
        return BadRequest("GitHub PAT or Owner/Repo not configured.");

    var split = ownerRepo.Split('/');
    if (split.Length != 2) return StatusCode(500, "Invalid Owner/Repo format.");
    var artifacts = await _githubService.GetWorkflowRunArtifactsAsync(userId, split[0], split[1], runId);
    return artifacts is null
        ? StatusCode(500, $"Failed to retrieve artifacts for {ownerRepo}/{runId}.")
        : Ok(artifacts);
}

[HttpGet("workflows/runs/{runId}/logs")]
public async Task<ActionResult> DownloadWorkflowRunLogs(long runId)
{
    var userIdClaim = User.FindFirstValue("id");
    if (!Guid.TryParse(userIdClaim, out var userId))
        return Unauthorized("Invalid user ID.");

    var (pat, ownerRepo) = await _patService.GetGitHubCredentialsAsync(userId);
    if (string.IsNullOrEmpty(pat) || string.IsNullOrEmpty(ownerRepo))
        return BadRequest("GitHub PAT or Owner/Repo not configured.");

    var split = ownerRepo.Split('/');
    if (split.Length != 2) return StatusCode(500, "Invalid Owner/Repo format.");
    var file = await _githubService.DownloadWorkflowRunLogsAsync(userId, split[0], split[1], runId);
    return file is null
        ? NotFound($"Logs for run {runId} not found for {ownerRepo}.")
        : File(file.Content, file.ContentType, file.FileName);
}

[HttpGet("workflows/artifacts/{artifactId}/zip")]
public async Task<ActionResult> DownloadArtifact(long artifactId)
{
    var userIdClaim = User.FindFirstValue("id");
    if (!Guid.TryParse(userIdClaim, out var userId))
        return Unauthorized("Invalid user ID.");

    var (pat, ownerRepo) = await _patService.GetGitHubCredentialsAsync(userId);
    if (string.IsNullOrEmpty(pat) || string.IsNullOrEmpty(ownerRepo))
        return BadRequest("GitHub PAT or Owner/Repo not configured.");

    var split = ownerRepo.Split('/');
    if (split.Length != 2) return StatusCode(500, "Invalid Owner/Repo format.");
    var file = await _githubService.DownloadSpecificArtifactAsync(userId, split[0], split[1], artifactId);
    return file is null
        ? NotFound($"Artifact {artifactId} not found for {ownerRepo}.")
        : File(file.Content, file.ContentType, file.FileName);
}

 

    /* ───────────────── anonymous project endpoints ───────────────── */

    [AllowAnonymous]
    [HttpGet("project/workflows/runs")]
    public async Task<ActionResult<List<GitHubWorkflowRun>>> GetProjectWorkflowRuns()
    {
        if (string.IsNullOrEmpty(_projectOwnerRepo) || string.IsNullOrEmpty(_projectPat))
            return StatusCode(503, "GitHub project owner/repository or PAT is not configured on the server. Please check appsettings.json or user secrets.");

        var parts = _projectOwnerRepo.Split('/');
        if (parts.Length != 2)
            return StatusCode(500, "Invalid GitHub:ProjectOwnerRepo format in server configuration. Expected 'owner/repo'.");

        var owner = parts[0];
        var repo = parts[1];

        var runs = await _githubService.GetWorkflowRunsWithPatAsync(owner, repo, _projectPat);
        if (runs == null) return StatusCode(500, "Failed to retrieve project GitHub workflow runs. Please check server logs for details.");
        return Ok(runs);
    }

    [AllowAnonymous]
    [HttpGet("project/workflows/runs/{runId}")]
    public async Task<ActionResult<GitHubWorkflowRun>> GetSingleProjectWorkflowRun(long runId)
    {
        if (string.IsNullOrEmpty(_projectOwnerRepo) || string.IsNullOrEmpty(_projectPat))
            return StatusCode(503, "GitHub project owner/repository or PAT is not configured on the server.");

        var parts = _projectOwnerRepo.Split('/');
        if (parts.Length != 2)
            return StatusCode(500, "Invalid GitHub:ProjectOwnerRepo format in server configuration. Expected 'owner/repo'.");

        var owner = parts[0];
        var repo = parts[1];

        var run = await _githubService.GetSingleWorkflowRunWithPatAsync(owner, repo, runId, _projectPat);
        if (run == null) return NotFound($"Workflow run with ID {runId} not found or failed to retrieve for project {_projectOwnerRepo}.");
        return Ok(run);
    }

    [AllowAnonymous]
    [HttpGet("project/workflows/runs/{runId}/jobs")]
    public async Task<ActionResult<List<GitHubJob>>> GetProjectWorkflowRunJobs(long runId)
    {
        if (string.IsNullOrEmpty(_projectOwnerRepo) || string.IsNullOrEmpty(_projectPat))
            return StatusCode(503, "GitHub project owner/repository or PAT is not configured on the server.");

        var parts = _projectOwnerRepo.Split('/');
        if (parts.Length != 2)
            return StatusCode(500, "Invalid GitHub:ProjectOwnerRepo format in server configuration. Expected 'owner/repo'.");

        var owner = parts[0];
        var repo = parts[1];

        _log.LogInformation("ProjJobs: owner={Owner} repo={Repo} runId={RunId}", owner, repo, runId);

        var jobs = await _githubService.GetWorkflowRunJobsWithPatAsync(owner, repo, runId, _projectPat);

        if (jobs is null)
        {
            _log.LogError("ProjJobsNull: owner={Owner} repo={Repo} runId={RunId}", owner, repo, runId);
            return StatusCode(500, $"Failed to retrieve project workflow jobs for {_projectOwnerRepo}/{runId}.");
        }

        _log.LogInformation("ProjJobsCount: owner={Owner} repo={Repo} runId={RunId} count={Count}", owner, repo, runId, jobs.Count);
        return Ok(jobs);
    }

    [AllowAnonymous]
    [HttpGet("project/workflows/runs/{runId}/logs")]
    public async Task<ActionResult> DownloadProjectWorkflowRunLogs(long runId)
    {
        if (string.IsNullOrEmpty(_projectOwnerRepo) || string.IsNullOrEmpty(_projectPat))
            return StatusCode(503, "GitHub project owner/repository or PAT is not configured on the server.");

        var parts = _projectOwnerRepo.Split('/');
        if (parts.Length != 2)
            return StatusCode(500, "Invalid GitHub:ProjectOwnerRepo format in server configuration. Expected 'owner/repo'.");

        var owner = parts[0];
        var repo = parts[1];

        var fileContent = await _githubService.DownloadWorkflowRunLogsWithPatAsync(owner, repo, runId, _projectPat);
        if (fileContent == null) return NotFound($"Logs for project workflow run ID {runId} not found or failed to retrieve for {_projectOwnerRepo}.");
        return File(fileContent.Content, fileContent.ContentType, fileContent.FileName);
    }

    [AllowAnonymous]
    [HttpGet("project/workflows/runs/{runId}/artifacts")]
    public async Task<ActionResult<List<GitHubArtifact>>> GetProjectWorkflowRunArtifacts(long runId)
    {
        if (string.IsNullOrEmpty(_projectOwnerRepo) || string.IsNullOrEmpty(_projectPat))
            return StatusCode(503, "GitHub project owner/repository or PAT is not configured on the server.");

        var parts = _projectOwnerRepo.Split('/');
        if (parts.Length != 2)
            return StatusCode(500, "Invalid GitHub:ProjectOwnerRepo format in server configuration. Expected 'owner/repo'.");

        var owner = parts[0];
        var repo = parts[1];

        _log.LogInformation("ProjArtifacts: owner={Owner} repo={Repo} runId={RunId}", owner, repo, runId);

        var artifacts = await _githubService.GetWorkflowRunArtifactsWithPatAsync(owner, repo, runId, _projectPat);

        if (artifacts is null)
        {
            _log.LogError("ProjArtifactsNull: owner={Owner} repo={Repo} runId={RunId}", owner, repo, runId);
            return StatusCode(500, $"Failed to retrieve project workflow artifacts for {_projectOwnerRepo}/{runId}.");
        }

        _log.LogInformation("ProjArtifactsCount: owner={Owner} repo={Repo} runId={RunId} count={Count}", owner, repo, runId, artifacts.Count);
        return Ok(artifacts);
    }

    [AllowAnonymous]
    [HttpGet("project/workflows/artifacts/{artifactId}/zip")]
    public async Task<ActionResult> DownloadProjectSpecificArtifact(long artifactId)
    {
        if (string.IsNullOrEmpty(_projectOwnerRepo) || string.IsNullOrEmpty(_projectPat))
            return StatusCode(503, "GitHub project owner/repository or PAT is not configured on the server.");

        var parts = _projectOwnerRepo.Split('/');
        if (parts.Length != 2)
            return StatusCode(500, "Invalid GitHub:ProjectOwnerRepo format in server configuration. Expected 'owner/repo'.");

        var owner = parts[0];
        var repo = parts[1];

        var fileContent = await _githubService.DownloadSpecificArtifactWithPatAsync(owner, repo, artifactId, _projectPat);
        if (fileContent == null) return NotFound($"Project artifact with ID {artifactId} not found or failed to retrieve for {_projectOwnerRepo}.");
        return File(fileContent.Content, fileContent.ContentType, fileContent.FileName);
    }
}