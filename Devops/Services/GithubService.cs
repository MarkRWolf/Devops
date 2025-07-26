// Devops/Services/GitHubService.cs
namespace Devops.Services;

using Devops.Models;
using Devops.Services.Interfaces;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Net.Http;
using Microsoft.Extensions.Logging;
using System.Net;

public sealed class GitHubService : IGitHubService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IPatService _patService; 
    private readonly ILogger<GitHubService> _logger;

    public GitHubService(IHttpClientFactory httpClientFactory, IPatService patService, ILogger<GitHubService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _patService = patService;
        _logger = logger;
    }

    private HttpClient CreateGitHubClient(string pat)
    {
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("DevOpsDashboard", "1.0"));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("token", pat);
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github.v3+json"));
        return client;
    }

    private async Task<string?> GetAndValidatePatAsync(Guid userId)
    {
        var pat = await _patService.GetDecryptedGitHubPatAsync(userId);
        if (string.IsNullOrEmpty(pat))
        {
            _logger.LogWarning("GitHub PAT not found for user {UserId}", userId);
            return null;
        }
        return pat;
    }

    private async Task<T?> FetchGitHubData<T>(HttpClient client, string url, string errorMessage)
    {
        try
        {
            var response = await client.GetAsync(url);
            response.EnsureSuccessStatusCode();
            var jsonResponse = await response.Content.ReadAsStringAsync();
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return JsonSerializer.Deserialize<T>(jsonResponse, options);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "{ErrorMessage}. URL: {Url}. Status Code: {StatusCode}", errorMessage, url, ex.StatusCode);
            return default;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "{ErrorMessage}. Error deserializing JSON from URL: {Url}", errorMessage, url);
            return default;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "{ErrorMessage}. An unexpected error occurred. URL: {Url}", errorMessage, url);
            return default;
        }
    }

    // Existing user-specific method implementations (remain unchanged)
    public async Task<List<GitHubWorkflowRun>?> GetWorkflowRunsAsync(Guid userId, string owner, string repo)
    {
        var pat = await GetAndValidatePatAsync(userId);
        if (pat == null) return null;
        using var client = CreateGitHubClient(pat);
        var url = $"https://api.github.com/repos/{owner}/{repo}/actions/runs";
        var result = await FetchGitHubData<GitHubWorkflowRunsResponse>(client, url, $"Error fetching GitHub workflow runs for {owner}/{repo}");
        return result?.WorkflowRuns;
    }

    public async Task<GitHubWorkflowRun?> GetSingleWorkflowRunAsync(Guid userId, string owner, string repo, long runId)
    {
        var pat = await GetAndValidatePatAsync(userId);
        if (pat == null) return null;
        using var client = CreateGitHubClient(pat);
        var url = $"https://api.github.com/repos/{owner}/{repo}/actions/runs/{runId}";
        return await FetchGitHubData<GitHubWorkflowRun>(client, url, $"Error fetching single GitHub workflow run {runId} for {owner}/{repo}");
    }

    public async Task<List<GitHubJob>?> GetWorkflowRunJobsAsync(Guid userId, string owner, string repo, long runId)
    {
        var pat = await GetAndValidatePatAsync(userId);
        if (pat == null) return null;
        using var client = CreateGitHubClient(pat);
        var url = $"https://api.github.com/repos/{owner}/{repo}/actions/runs/{runId}/jobs";
        var result = await FetchGitHubData<GitHubJobsResponse>(client, url, $"Error fetching GitHub workflow run jobs for {owner}/{repo}/{runId}");
        return result?.Jobs;
    }

    public async Task<GitHubFileContent?> DownloadWorkflowRunLogsAsync(Guid userId, string owner, string repo, long runId)
    {
        var pat = await GetAndValidatePatAsync(userId);
        if (pat == null) return null;
        using var client = CreateGitHubClient(pat);
        var url = $"https://api.github.com/repos/{owner}/{repo}/actions/runs/{runId}/logs";
        try
        {
            var response = await client.GetAsync(url, HttpCompletionOption.ResponseHeadersRead);
            if (response.StatusCode == HttpStatusCode.Found || response.StatusCode == HttpStatusCode.TemporaryRedirect)
            {
                var redirectUrl = response.Headers.Location?.ToString();
                if (string.IsNullOrEmpty(redirectUrl))
                {
                    _logger.LogError("Redirect URL not found for logs download for {Owner}/{Repo}/{RunId}", owner, repo, runId);
                    return null;
                }
                using var downloadClient = _httpClientFactory.CreateClient();
                var downloadResponse = await downloadClient.GetAsync(redirectUrl);
                downloadResponse.EnsureSuccessStatusCode();
                var contentBytes = await downloadResponse.Content.ReadAsByteArrayAsync();
                var fileName = downloadResponse.Content.Headers.ContentDisposition?.FileNameStar ?? downloadResponse.Content.Headers.ContentDisposition?.FileName?.Trim('"') ?? $"logs_{runId}.zip";
                var contentType = downloadResponse.Content.Headers.ContentType?.ToString() ?? "application/zip";
                return new GitHubFileContent { Content = contentBytes, FileName = fileName, ContentType = contentType };
            }
            else
            {
                response.EnsureSuccessStatusCode();
                _logger.LogError("Unexpected status code {StatusCode} when fetching logs for {Owner}/{Repo}/{RunId}", response.StatusCode, owner, repo, runId);
                return null;
            }
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Error downloading GitHub workflow run logs for {Owner}/{Repo}/{RunId}. Status Code: {StatusCode}", owner, repo, runId, ex.StatusCode);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unexpected error occurred while downloading GitHub workflow run logs for {Owner}/{Repo}/{RunId}", owner, repo, runId);
            return null;
        }
    }

    public async Task<List<GitHubArtifact>?> GetWorkflowRunArtifactsAsync(Guid userId, string owner, string repo, long runId)
    {
        var pat = await GetAndValidatePatAsync(userId);
        if (pat == null) return null;
        using var client = CreateGitHubClient(pat);
        var url = $"https://api.github.com/repos/{owner}/{repo}/actions/runs/{runId}/artifacts";
        var result = await FetchGitHubData<GitHubArtifactsResponse>(client, url, $"Error fetching GitHub workflow run artifacts for {owner}/{repo}/{runId}");
        return result?.Artifacts;
    }

    public async Task<GitHubFileContent?> DownloadSpecificArtifactAsync(Guid userId, string owner, string repo, long artifactId)
    {
        var pat = await GetAndValidatePatAsync(userId);
        if (pat == null) return null;
        using var client = CreateGitHubClient(pat);
        var url = $"https://api.github.com/repos/{owner}/{repo}/actions/artifacts/{artifactId}/zip";
        try
        {
            var response = await client.GetAsync(url, HttpCompletionOption.ResponseHeadersRead);
            response.EnsureSuccessStatusCode();
            if (response.StatusCode == HttpStatusCode.Found || response.StatusCode == HttpStatusCode.TemporaryRedirect)
            {
                var redirectUrl = response.Headers.Location?.ToString();
                if (string.IsNullOrEmpty(redirectUrl))
                {
                    _logger.LogError("Redirect URL not found for artifact download for {Owner}/{Repo}/{ArtifactId}", owner, repo, artifactId);
                    return null;
                }
                using var downloadClient = _httpClientFactory.CreateClient();
                var downloadResponse = await downloadClient.GetAsync(redirectUrl);
                downloadResponse.EnsureSuccessStatusCode();
                var contentBytes = await downloadResponse.Content.ReadAsByteArrayAsync();
                var fileName = downloadResponse.Content.Headers.ContentDisposition?.FileNameStar ?? downloadResponse.Content.Headers.ContentDisposition?.FileName?.Trim('"') ?? $"artifact_{artifactId}.zip";
                var contentType = downloadResponse.Content.Headers.ContentType?.ToString() ?? "application/zip";
                return new GitHubFileContent { Content = contentBytes, FileName = fileName, ContentType = contentType };
            }
            else
            {
                _logger.LogError("Unexpected status code {StatusCode} when fetching artifact {ArtifactId} for {Owner}/{Repo}", response.StatusCode, artifactId, owner, repo);
                return null;
            }
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Error downloading GitHub artifact {ArtifactId} for {Owner}/{Repo}. Status Code: {StatusCode}", artifactId, owner, repo, ex.StatusCode);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unexpected error occurred while downloading GitHub artifact {ArtifactId} for {Owner}/{Repo}", artifactId, owner, repo);
            return null;
        }
    }

    // New project-specific method implementations (using provided PAT)
    public async Task<List<GitHubWorkflowRun>?> GetWorkflowRunsWithPatAsync(string owner, string repo, string pat)
    {
        using var client = CreateGitHubClient(pat);
        var url = $"https://api.github.com/repos/{owner}/{repo}/actions/runs";
        var result = await FetchGitHubData<GitHubWorkflowRunsResponse>(client, url, $"Error fetching GitHub workflow runs for {owner}/{repo} with provided PAT");
        return result?.WorkflowRuns;
    }

    public async Task<GitHubWorkflowRun?> GetSingleWorkflowRunWithPatAsync(string owner, string repo, long runId, string pat)
    {
        using var client = CreateGitHubClient(pat);
        var url = $"https://api.github.com/repos/{owner}/{repo}/actions/runs/{runId}";
        return await FetchGitHubData<GitHubWorkflowRun>(client, url, $"Error fetching single GitHub workflow run {runId} for {owner}/{repo} with provided PAT");
    }

    public async Task<List<GitHubJob>?> GetWorkflowRunJobsWithPatAsync(string owner, string repo, long runId, string pat)
    {
        using var client = CreateGitHubClient(pat);
        var url = $"https://api.github.com/repos/{owner}/{repo}/actions/runs/{runId}/jobs";
        var result = await FetchGitHubData<GitHubJobsResponse>(client, url, $"Error fetching GitHub workflow run jobs for {owner}/{repo}/{runId} with provided PAT");
        return result?.Jobs;
    }

    public async Task<GitHubFileContent?> DownloadWorkflowRunLogsWithPatAsync(string owner, string repo, long runId, string pat)
    {
        using var client = CreateGitHubClient(pat);
        var url = $"https://api.github.com/repos/{owner}/{repo}/actions/runs/{runId}/logs";
        try
        {
            var response = await client.GetAsync(url, HttpCompletionOption.ResponseHeadersRead);
            if (response.StatusCode == HttpStatusCode.Found || response.StatusCode == HttpStatusCode.TemporaryRedirect)
            {
                var redirectUrl = response.Headers.Location?.ToString();
                if (string.IsNullOrEmpty(redirectUrl))
                {
                    _logger.LogError("Redirect URL not found for logs download for {Owner}/{Repo}/{RunId} with provided PAT", owner, repo, runId);
                    return null;
                }
                using var downloadClient = _httpClientFactory.CreateClient();
                downloadClient.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("DevOpsDashboard", "1.0"));
                downloadClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github.v3+json"));
                downloadClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("token", pat);

                var downloadResponse = await downloadClient.GetAsync(redirectUrl);

                downloadResponse.EnsureSuccessStatusCode();
                var contentBytes = await downloadResponse.Content.ReadAsByteArrayAsync();
                var fileName = downloadResponse.Content.Headers.ContentDisposition?.FileNameStar ?? downloadResponse.Content.Headers.ContentDisposition?.FileName?.Trim('"') ?? $"logs_{runId}.zip";
                var contentType = downloadResponse.Content.Headers.ContentType?.ToString() ?? "application/zip";
                return new GitHubFileContent { Content = contentBytes, FileName = fileName, ContentType = contentType };
            }
            else
            {
                response.EnsureSuccessStatusCode();
                _logger.LogError("Unexpected status code {StatusCode} when fetching logs for {Owner}/{Repo}/{RunId} with provided PAT", response.StatusCode, owner, repo, runId);
                return null;
            }
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Error downloading GitHub workflow run logs for {Owner}/{Repo}/{RunId} with provided PAT. Status Code: {StatusCode}", owner, repo, runId, ex.StatusCode);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unexpected error occurred while downloading GitHub workflow run logs for {Owner}/{Repo}/{RunId} with provided PAT", owner, repo, runId);
            return null;
        }
    }

    public async Task<List<GitHubArtifact>?> GetWorkflowRunArtifactsWithPatAsync(string owner, string repo, long runId, string pat)
    {
        using var client = CreateGitHubClient(pat);
        var url = $"https://api.github.com/repos/{owner}/{repo}/actions/runs/{runId}/artifacts";
        var result = await FetchGitHubData<GitHubArtifactsResponse>(client, url, $"Error fetching GitHub workflow run artifacts for {owner}/{repo}/{runId} with provided PAT");
        return result?.Artifacts;
    }

    public async Task<GitHubFileContent?> DownloadSpecificArtifactWithPatAsync(string owner, string repo, long artifactId, string pat)
{
    using var client = CreateGitHubClient(pat);
    var url = $"https://api.github.com/repos/{owner}/{repo}/actions/artifacts/{artifactId}/zip";
    try
    {
        var response = await client.GetAsync(url, HttpCompletionOption.ResponseHeadersRead);

        // GitHub normally responds with 302 -> signed download URL
        if ((int)response.StatusCode >= 300 && (int)response.StatusCode < 400 &&
            response.Headers.Location is Uri redirectUri)
        {
            using var downloadClient = _httpClientFactory.CreateClient();
            var downloadResponse = await downloadClient.GetAsync(redirectUri);
            if (!downloadResponse.IsSuccessStatusCode)
            {
                _logger.LogError("Artifact redirect download failed {Status} for {Owner}/{Repo}/{ArtifactId}", downloadResponse.StatusCode, owner, repo, artifactId);
                return null;
            }
            var contentBytes = await downloadResponse.Content.ReadAsByteArrayAsync();
            var fileName = downloadResponse.Content.Headers.ContentDisposition?.FileNameStar
                           ?? downloadResponse.Content.Headers.ContentDisposition?.FileName?.Trim('"')
                           ?? $"artifact_{artifactId}.zip";
            var contentType = downloadResponse.Content.Headers.ContentType?.ToString() ?? "application/zip";
            return new GitHubFileContent { Content = contentBytes, FileName = fileName, ContentType = contentType };
        }

        // Fallback: got 200 directly
        if (response.IsSuccessStatusCode)
        {
            var contentBytes = await response.Content.ReadAsByteArrayAsync();
            var fileName = response.Content.Headers.ContentDisposition?.FileNameStar
                           ?? response.Content.Headers.ContentDisposition?.FileName?.Trim('"')
                           ?? $"artifact_{artifactId}.zip";
            var contentType = response.Content.Headers.ContentType?.ToString() ?? "application/zip";
            return new GitHubFileContent { Content = contentBytes, FileName = fileName, ContentType = contentType };
        }

        _logger.LogError("Unexpected status {Status} when requesting artifact {ArtifactId} for {Owner}/{Repo}", response.StatusCode, artifactId, owner, repo);
        return null;
    }
    catch (HttpRequestException ex)
    {
        _logger.LogError(ex, "Error downloading artifact {ArtifactId} for {Owner}/{Repo}", artifactId, owner, repo);
        return null;
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Unexpected error downloading artifact {ArtifactId} for {Owner}/{Repo}", artifactId, owner, repo);
        return null;
    }
}
}