namespace Devops.Services.Interfaces;

using Devops.Models;

public interface IGitHubService
{
    Task<List<GitHubWorkflowRun>?> GetWorkflowRunsAsync(Guid userId, string owner, string repo);
}