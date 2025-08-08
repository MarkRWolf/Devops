using Devops.Models;

namespace Devops.Services.Interfaces;

public interface IAzureDevOpsService
{
    Task<List<AzureBuild>?> GetBuildsAsync(Guid userId);
    Task<AzureBuild?> GetBuildAsync(Guid userId, int buildId);
    Task<List<AzureJob>?> GetBuildTimelineAsync(Guid userId, int buildId);
    Task<List<AzureArtifact>?> GetBuildArtifactsAsync(Guid userId, int buildId);
    Task<GitHubFileContent?> DownloadBuildLogsAsync(Guid userId, int buildId);
    Task<GitHubFileContent?> DownloadArtifactAsync(Guid userId, string downloadUrl);

    /* project-wide (anonymous) endpoints */
    Task<List<AzureBuild>?> GetBuildsWithPatAsync(string org, string project, string pat);
    Task<AzureBuild?> GetBuildWithPatAsync(string org, string project, int buildId, string pat);
    Task<List<AzureJob>?> GetBuildTimelineWithPatAsync(string org, string project, int buildId, string pat);
    Task<List<AzureArtifact>?> GetBuildArtifactsWithPatAsync(string org, string project, int buildId, string pat);
    Task<GitHubFileContent?> DownloadBuildLogsWithPatAsync(string org, string project, int buildId, string pat);
    Task<GitHubFileContent?> DownloadArtifactWithPatAsync(string downloadUrl, string pat);
}
