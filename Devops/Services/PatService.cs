// Devops/Services/PatService.cs
namespace Devops.Services;

using Devops.Data;
using Devops.Models; // Assuming your User model (with EncryptedGitHubPat and GitHubOwnerRepo) is here
using Devops.Services.Interfaces;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Net.Http.Headers;
using System.Net.Http;
using Microsoft.Extensions.Logging;

public sealed class PatService : IPatService
{
    private readonly DevopsDb _db;
    private readonly IDataProtectionProvider _dpProvider;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<PatService> _logger;

    public PatService(DevopsDb db, IDataProtectionProvider dpProvider, IHttpClientFactory httpClientFactory, ILogger<PatService> logger)
    {
        _db = db;
        _dpProvider = dpProvider;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    private IDataProtector GetProtector() => _dpProvider.CreateProtector("GitHubPatProtection");

    public async Task<(bool Success, string? Error)> StoreGitHubPatAsync(Guid userId, string pat, string ownerRepo)
    {
        if (!await IsGitHubPatValidAsync(pat))
        {
            return (false, "Invalid GitHub PAT. Please check your token and its permissions.");
        }

        if (!await IsOwnerRepoValidAsync(pat, ownerRepo))
        {
            return (false, "Invalid GitHub owner/repository or PAT lacks access to it.");
        }

        var protector = GetProtector();
        var encryptedPat = protector.Protect(pat);

        var user = await _db.Users.FindAsync(userId);
        if (user == null)
        {
            return (false, "User not found.");
        }

        user.EncryptedGitHubPat = encryptedPat;
        user.GitHubOwnerRepo = ownerRepo;
        user.HasGitHubConfig = true;
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<string?> GetDecryptedGitHubPatAsync(Guid userId)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user?.EncryptedGitHubPat == null)
        {
            return null;
        }

        var protector = GetProtector();
        return protector.Unprotect(user.EncryptedGitHubPat);
    }

    public async Task<(string? DecryptedPat, string? OwnerRepo)> GetGitHubCredentialsAsync(Guid userId)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user?.EncryptedGitHubPat == null || user?.GitHubOwnerRepo == null)
        {
            return (null, null);
        }

        var protector = GetProtector();
        var decryptedPat = protector.Unprotect(user.EncryptedGitHubPat);
        return (decryptedPat, user.GitHubOwnerRepo);
    }

    public async Task<bool> IsGitHubPatValidAsync(string pat)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("DevOpsDashboard", "1.0"));
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("token", pat);

            var response = await client.GetAsync("https://api.github.com/user");

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("GitHub PAT validation failed. Status: {StatusCode}, Content: {ErrorContent}", response.StatusCode, errorContent);

                try
                {
                    using JsonDocument doc = JsonDocument.Parse(errorContent);
                    if (doc.RootElement.TryGetProperty("message", out JsonElement messageElement))
                    {
                        var errorMessage = messageElement.GetString();
                        if (errorMessage != null && errorMessage.Contains("Bad credentials", StringComparison.OrdinalIgnoreCase))
                        {
                            return false;
                        }
                    }
                }
                catch (JsonException ex)
                {
                    _logger.LogDebug(ex, "Could not parse GitHub API error response as JSON for PAT validation.");
                }
                return false;
            }
            return true;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Network error during GitHub PAT validation.");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unexpected error occurred during GitHub PAT validation.");
            return false;
        }
    }

    public async Task<bool> IsOwnerRepoValidAsync(string pat, string ownerRepo)
    {
        if (string.IsNullOrWhiteSpace(ownerRepo))
        {
            return false;
        }
        var parts = ownerRepo.Split('/');
        if (parts.Length != 2 || parts.Any(string.IsNullOrWhiteSpace))
        {
            return false;
        }
        var owner = parts[0];
        var repo = parts[1];

        try
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("DevOpsDashboard", "1.0"));
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("token", pat);

            var response = await client.GetAsync($"https://api.github.com/repos/{owner}/{repo}");

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("GitHub repository access validation failed for {OwnerRepo}. Status: {StatusCode}, Content: {ErrorContent}", ownerRepo, response.StatusCode, errorContent);
                return false;
            }
            return true;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Network error during GitHub repository validation for {OwnerRepo}.", ownerRepo);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unexpected error occurred during GitHub repository validation for {OwnerRepo}.", ownerRepo);
            return false;
        }
    }
}