// Devops/Services/Interfaces/IGitHubService.cs
namespace Devops.Services.Interfaces;

using Devops.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IGitHubService
{
    // Existing user-specific methods
    Task<List<GitHubWorkflowRun>?> GetWorkflowRunsAsync(Guid userId, string owner, string repo);
    Task<GitHubWorkflowRun?> GetSingleWorkflowRunAsync(Guid userId, string owner, string repo, long runId);
    Task<List<GitHubJob>?> GetWorkflowRunJobsAsync(Guid userId, string owner, string repo, long runId);
    Task<GitHubFileContent?> DownloadWorkflowRunLogsAsync(Guid userId, string owner, string repo, long runId);
    Task<List<GitHubArtifact>?> GetWorkflowRunArtifactsAsync(Guid userId, string owner, string repo, long runId);
    Task<GitHubFileContent?> DownloadSpecificArtifactAsync(Guid userId, string owner, string repo, long artifactId);

    // New project-specific methods (accept PAT directly)
    Task<List<GitHubWorkflowRun>?> GetWorkflowRunsWithPatAsync(string owner, string repo, string pat);
    Task<GitHubWorkflowRun?> GetSingleWorkflowRunWithPatAsync(string owner, string repo, long runId, string pat);
    Task<List<GitHubJob>?> GetWorkflowRunJobsWithPatAsync(string owner, string repo, long runId, string pat);
    Task<GitHubFileContent?> DownloadWorkflowRunLogsWithPatAsync(string owner, string repo, long runId, string pat);
    Task<List<GitHubArtifact>?> GetWorkflowRunArtifactsWithPatAsync(string owner, string repo, long runId, string pat);
    Task<GitHubFileContent?> DownloadSpecificArtifactWithPatAsync(string owner, string repo, long artifactId, string pat);
}