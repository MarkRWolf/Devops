// Services/PatService.cs
namespace Devops.Services;

using Devops.Data;
using Devops.Services.Interfaces;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

public sealed class PatService : IPatService
{
    private readonly DevopsDb _db;
    private readonly IDataProtectionProvider _dpProvider;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<PatService> _logger;

    public PatService(DevopsDb db, IDataProtectionProvider dpProvider, IHttpClientFactory httpClientFactory, ILogger<PatService> logger)
        => (_db, _dpProvider, _httpClientFactory, _logger) = (db, dpProvider, httpClientFactory, logger);

    /* ───────── protectors ───────── */

    private IDataProtector GetPatProtector() => _dpProvider.CreateProtector("GitHubPatProtection");
    private IDataProtector GetHookProtector() => _dpProvider.CreateProtector("GitHubWebhookSecretProtection");

    /* ───────── PAT CRUD ───────── */

    public async Task<(bool Success, string? Error)> StoreGitHubPatAsync(Guid userId, string pat, string ownerRepo)
    {
        if (!await IsGitHubPatValidAsync(pat)) return (false, "Invalid GitHub PAT.");
        if (!await IsOwnerRepoValidAsync(pat, ownerRepo)) return (false, "PAT lacks access to repository.");

        var encPat = GetPatProtector().Protect(pat);
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return (false, "User not found.");

        user.EncryptedGitHubPat = encPat;
        user.GitHubOwnerRepo = ownerRepo;
        user.HasGitHubConfig = true;
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<string?> GetDecryptedGitHubPatAsync(Guid userId)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        return user?.EncryptedGitHubPat is null ? null : GetPatProtector().Unprotect(user.EncryptedGitHubPat);
    }

    public async Task<(string? DecryptedPat, string? OwnerRepo)> GetGitHubCredentialsAsync(Guid userId)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return (null, null);
        var pat = user.EncryptedGitHubPat is null ? null : GetPatProtector().Unprotect(user.EncryptedGitHubPat);
        return (pat, user.GitHubOwnerRepo);
    }

    /* ───────── NEW: webhook secret CRUD ───────── */

    public async Task<string> RefreshGitHubWebhookSecretAsync(Guid userId)
    {
        var secretBytes = RandomNumberGenerator.GetBytes(32);
        var secretHex = Convert.ToHexString(secretBytes).ToLowerInvariant();

        var enc = GetHookProtector().Protect(secretHex);
        var user = await _db.Users.FindAsync(userId) ?? throw new InvalidOperationException("User not found.");
        user.EncryptedGitHubWebhookSecret = enc;
        await _db.SaveChangesAsync();

        return secretHex; // return plain secret exactly once
    }

    public async Task<string?> GetDecryptedGitHubWebhookSecretAsync(Guid userId)
    {
        var enc = await _db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => u.EncryptedGitHubWebhookSecret)
            .FirstOrDefaultAsync();

        return enc is null ? null : GetHookProtector().Unprotect(enc);
    }

    /* ───────── validation helpers (unchanged) ───────── */

    public async Task<bool> IsGitHubPatValidAsync(string pat)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("DevOpsDashboard", "1.0"));
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("token", pat);

            var res = await client.GetAsync("https://api.github.com/user");
            return res.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PAT validation error.");
            return false;
        }
    }

    public async Task<bool> IsOwnerRepoValidAsync(string pat, string ownerRepo)
    {
        var parts = ownerRepo.Split('/');
        if (parts.Length != 2) return false;
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("DevOpsDashboard", "1.0"));
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("token", pat);

            var res = await client.GetAsync($"https://api.github.com/repos/{ownerRepo}");
            return res.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Repo validation error for {OwnerRepo}.", ownerRepo);
            return false;
        }
    }
}
