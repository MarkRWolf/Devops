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

    // Project-level config (anonymous endpoints)
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

    [HttpGet("workflows/{owner}/{repo}/runs")]
    public async Task<ActionResult<List<GitHubWorkflowRun>>> GetWorkflowRuns(string owner, string repo)
    {
        var userId = await GetValidatedUserId();
        if (!userId.HasValue) return Unauthorized("Invalid user ID.");
        if (!await CheckPatExists(userId.Value)) return BadRequest("GitHub PAT not configured for your account.");
        var runs = await _githubService.GetWorkflowRunsAsync(userId.Value, owner, repo);
        if (runs == null) return StatusCode(500, "Failed to retrieve GitHub workflow runs. Please check server logs for details.");
        return Ok(runs);
    }

    [HttpGet("workflows/{owner}/{repo}/runs/{runId}")]
    public async Task<ActionResult<GitHubWorkflowRun>> GetSingleWorkflowRun(string owner, string repo, long runId)
    {
        var userId = await GetValidatedUserId();
        if (!userId.HasValue) return Unauthorized("Invalid user ID.");
        if (!await CheckPatExists(userId.Value)) return BadRequest("GitHub PAT not configured.");
        var run = await _githubService.GetSingleWorkflowRunAsync(userId.Value, owner, repo, runId);
        if (run == null) return NotFound($"Workflow run with ID {runId} not found or failed to retrieve for {owner}/{repo}.");
        return Ok(run);
    }

    [HttpGet("workflows/{owner}/{repo}/runs/{runId}/jobs")]
    public async Task<ActionResult<List<GitHubJob>>> GetWorkflowRunJobs(string owner, string repo, long runId)
    {
        var userId = await GetValidatedUserId();
        if (!userId.HasValue) return Unauthorized("Invalid user ID.");
        if (!await CheckPatExists(userId.Value)) return BadRequest("GitHub PAT not configured.");

        _log.LogInformation("UserJobs: user={UserId} owner={Owner} repo={Repo} runId={RunId}", userId, owner, repo, runId);

        var jobs = await _githubService.GetWorkflowRunJobsAsync(userId.Value, owner, repo, runId);

        if (jobs is null)
        {
            _log.LogError("UserJobsNull: user={UserId} owner={Owner} repo={Repo} runId={RunId}", userId, owner, repo, runId);
            return StatusCode(500, $"Failed to retrieve workflow jobs for {owner}/{repo}/{runId}.");
        }

        _log.LogInformation("UserJobsCount: user={UserId} owner={Owner} repo={Repo} runId={RunId} count={Count}", userId, owner, repo, runId, jobs.Count);
        return Ok(jobs);
    }

    [HttpGet("workflows/{owner}/{repo}/runs/{runId}/logs")]
    public async Task<ActionResult> DownloadWorkflowRunLogs(string owner, string repo, long runId)
    {
        var userId = await GetValidatedUserId();
        if (!userId.HasValue) return Unauthorized("Invalid user ID.");
        if (!await CheckPatExists(userId.Value)) return BadRequest("GitHub PAT not configured.");
        var fileContent = await _githubService.DownloadWorkflowRunLogsAsync(userId.Value, owner, repo, runId);
        if (fileContent == null) return NotFound($"Logs for workflow run ID {runId} not found or failed to retrieve for {owner}/{repo}.");
        return File(fileContent.Content, fileContent.ContentType, fileContent.FileName);
    }

    [HttpGet("workflows/{owner}/{repo}/runs/{runId}/artifacts")]
    public async Task<ActionResult<List<GitHubArtifact>>> GetWorkflowRunArtifacts(string owner, string repo, long runId)
    {
        var userId = await GetValidatedUserId();
        if (!userId.HasValue) return Unauthorized("Invalid user ID.");
        if (!await CheckPatExists(userId.Value)) return BadRequest("GitHub PAT not configured.");

        _log.LogInformation("UserArtifacts: user={UserId} owner={Owner} repo={Repo} runId={RunId}", userId, owner, repo, runId);

        var artifacts = await _githubService.GetWorkflowRunArtifactsAsync(userId.Value, owner, repo, runId);

        if (artifacts is null)
        {
            _log.LogError("UserArtifactsNull: user={UserId} owner={Owner} repo={Repo} runId={RunId}", userId, owner, repo, runId);
            return StatusCode(500, $"Failed to retrieve workflow artifacts for {owner}/{repo}/{runId}.");
        }

        _log.LogInformation("UserArtifactsCount: user={UserId} owner={Owner} repo={Repo} runId={RunId} count={Count}", userId, owner, repo, runId, artifacts.Count);
        return Ok(artifacts);
    }

    [HttpGet("workflows/{owner}/{repo}/artifacts/{artifactId}/zip")]
    public async Task<ActionResult> DownloadSpecificArtifact(string owner, string repo, long artifactId)
    {
        var userId = await GetValidatedUserId();
        if (!userId.HasValue) return Unauthorized("Invalid user ID.");
        if (!await CheckPatExists(userId.Value)) return BadRequest("GitHub PAT not configured.");
        var fileContent = await _githubService.DownloadSpecificArtifactAsync(userId.Value, owner, repo, artifactId);
        if (fileContent == null) return NotFound($"Artifact with ID {artifactId} not found or failed to retrieve for {owner}/{repo}.");
        return File(fileContent.Content, fileContent.ContentType, fileContent.FileName);
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
