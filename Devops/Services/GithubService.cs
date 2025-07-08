namespace Devops.Services;

using Devops.Models;
using Devops.Services.Interfaces;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Net.Http;
using Microsoft.Extensions.Logging;

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

    public async Task<List<GitHubWorkflowRun>?> GetWorkflowRunsAsync(Guid userId, string owner, string repo)
    {
        var pat = await _patService.GetDecryptedGitHubPatAsync(userId);
        if (string.IsNullOrEmpty(pat))
        {
            _logger.LogWarning("GitHub PAT not found for user {UserId}", userId);
            return null;
        }

        using var client = CreateGitHubClient(pat);
        var url = $"https://api.github.com/repos/{owner}/{repo}/actions/runs";

        try
        {
            var response = await client.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var jsonResponse = await response.Content.ReadAsStringAsync();
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            var result = JsonSerializer.Deserialize<GitHubWorkflowRunsResponse>(jsonResponse, options);

            return result?.WorkflowRuns;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Error fetching GitHub workflow runs for {Owner}/{Repo}. Status Code: {StatusCode}", owner, repo, ex.StatusCode);
            return null;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Error deserializing GitHub workflow runs response.");
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unexpected error occurred while fetching GitHub workflow runs.");
            return null;
        }
    }
}