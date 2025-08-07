namespace Devops.Services;

using Devops.Models;
using Devops.Services.Interfaces;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

public sealed class AzureDevOpsService : IAzureDevOpsService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IPatService _patService;
    private readonly ILogger<AzureDevOpsService> _logger;

    public AzureDevOpsService(IHttpClientFactory httpClientFactory, IPatService patService, ILogger<AzureDevOpsService> logger)
        => (_httpClientFactory, _patService, _logger) = (httpClientFactory, patService, logger);

    HttpClient Client(string pat)
    {
        var c = _httpClientFactory.CreateClient();
        c.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Basic", Convert.ToBase64String(Encoding.ASCII.GetBytes($":{pat}")));
        c.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("DevOpsDashboard", "1.0"));
        c.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        return c;
    }

    async Task<T?> Fetch<T>(HttpClient c, string url)
    {
        try
        {
            var res = await c.GetAsync(url);
            res.EnsureSuccessStatusCode();
            var json = await res.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<T>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ADO fetch failed {Url}", url);
            return default;
        }
    }

    /* ───────────── USER-SCOPED ───────────── */

    public async Task<List<AzureBuild>?> GetBuildsAsync(Guid userId)
    {
        var (pat, org, proj) = await _patService.GetAzureCredentialsAsync(userId);
        return pat is null ? null : await GetBuildsWithPatAsync(org!, proj!, pat);
    }

    public async Task<AzureBuild?> GetBuildAsync(Guid userId, int id)
    {
        var (pat, org, proj) = await _patService.GetAzureCredentialsAsync(userId);
        return pat is null ? null : await GetBuildWithPatAsync(org!, proj!, id, pat);
    }

    public async Task<List<AzureJob>?> GetBuildTimelineAsync(Guid userId, int id)
    {
        var (pat, org, proj) = await _patService.GetAzureCredentialsAsync(userId);
        return pat is null ? null : await GetBuildTimelineWithPatAsync(org!, proj!, id, pat);
    }

    public async Task<List<AzureArtifact>?> GetBuildArtifactsAsync(Guid userId, int id)
    {
        var (pat, org, proj) = await _patService.GetAzureCredentialsAsync(userId);
        return pat is null ? null : await GetBuildArtifactsWithPatAsync(org!, proj!, id, pat);
    }

    public async Task<GitHubFileContent?> DownloadBuildLogsAsync(Guid userId, int id)
    {
        var (pat, org, proj) = await _patService.GetAzureCredentialsAsync(userId);
        return pat is null ? null : await DownloadBuildLogsWithPatAsync(org!, proj!, id, pat);
    }

    public async Task<GitHubFileContent?> DownloadArtifactAsync(Guid userId, string url)
    {
        var (pat, _, _) = await _patService.GetAzureCredentialsAsync(userId);
        return pat is null ? null : await DownloadArtifactWithPatAsync(url, pat);
    }

    /* ───────────── PROJECT-SCOPED ───────────── */

    public async Task<List<AzureBuild>?> GetBuildsWithPatAsync(string org, string proj, string pat)
    {
        using var c = Client(pat);
        var u = $"https://dev.azure.com/{org}/{proj}/_apis/build/builds?api-version=7.1-preview.7";
        var r = await Fetch<AzureBuildsResponse>(c, u);
        return r?.Builds;
    }

    public async Task<AzureBuild?> GetBuildWithPatAsync(string org, string proj, int id, string pat)
    {
        using var c = Client(pat);
        var u = $"https://dev.azure.com/{org}/{proj}/_apis/build/builds/{id}?api-version=7.1-preview.7";
        return await Fetch<AzureBuild>(c, u);
    }

    public async Task<List<AzureJob>?> GetBuildTimelineWithPatAsync(string org, string proj, int id, string pat)
    {
        using var c = Client(pat);
        var u = $"https://dev.azure.com/{org}/{proj}/_apis/build/builds/{id}/timeline?api-version=7.1-preview.2";
        var r = await Fetch<AzureTimelineResponse>(c, u);
        return r?.Records;
    }

    public async Task<List<AzureArtifact>?> GetBuildArtifactsWithPatAsync(string org, string proj, int id, string pat)
    {
        using var c = Client(pat);
        var u = $"https://dev.azure.com/{org}/{proj}/_apis/build/builds/{id}/artifacts?api-version=7.1-preview.5";
        var r = await Fetch<AzureArtifactsResponse>(c, u);
        return r?.Artifacts;
    }

    public async Task<GitHubFileContent?> DownloadBuildLogsWithPatAsync(string org, string proj, int id, string pat)
    {
        using var c = Client(pat);
        var u = $"https://dev.azure.com/{org}/{proj}/_apis/build/builds/{id}/logs?api-version=7.1-preview.2&download=true";
        try
        {
            var res = await c.GetAsync(u, HttpCompletionOption.ResponseHeadersRead);
            res.EnsureSuccessStatusCode();
            var bytes = await res.Content.ReadAsByteArrayAsync();
            return new GitHubFileContent { Content = bytes, FileName = $"logs_{id}.zip", ContentType = "application/zip" };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ADO logs download failed {Url}", u);
            return null;
        }
    }

    public async Task<GitHubFileContent?> DownloadArtifactWithPatAsync(string url, string pat)
    {
        using var c = Client(pat);
        try
        {
            var res = await c.GetAsync(url, HttpCompletionOption.ResponseHeadersRead);
            res.EnsureSuccessStatusCode();
            var bytes = await res.Content.ReadAsByteArrayAsync();
            var fn = url.Split('/').LastOrDefault() ?? "artifact.zip";
            return new GitHubFileContent { Content = bytes, FileName = fn, ContentType = "application/zip" };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ADO artifact download failed {Url}", url);
            return null;
        }
    }
}
