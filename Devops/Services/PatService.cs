namespace Devops.Services;

using System;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Devops.Data;
using Devops.Services.Interfaces;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

public sealed class PatService : IPatService
{
    private readonly DevopsDb _db;
    private readonly IDataProtectionProvider _dp;
    private readonly IHttpClientFactory _http;
    private readonly ILogger<PatService> _log;

    public PatService(DevopsDb db, IDataProtectionProvider dp, IHttpClientFactory http, ILogger<PatService> log)
        => (_db, _dp, _http, _log) = (db, dp, http, log);

    IDataProtector GitProt  => _dp.CreateProtector("GitHubPat");
    IDataProtector HookProt => _dp.CreateProtector("GitHubHook");
    IDataProtector AzProt   => _dp.CreateProtector("AzurePat");

    /* ───── GitHub ───── */

    public async Task<(bool, string?)> StoreGitHubPatAsync(Guid uid, string pat, string ownerRepo)
    {
        if (!await IsGitHubPatValidAsync(pat))                 return (false, "Invalid GitHub PAT.");
        if (!await IsOwnerRepoValidAsync(pat, ownerRepo))      return (false, "PAT lacks access to repository.");

        var u = await _db.Users.FindAsync(uid) ?? throw new InvalidOperationException("User not found.");
        u.EncryptedGitHubPat = GitProt.Protect(pat);
        u.GitHubOwnerRepo    = ownerRepo;
        u.HasGitHubConfig    = true;
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<string?> GetDecryptedGitHubPatAsync(Guid uid)
        => (await _db.Users.AsNoTracking()
                 .Where(x => x.Id == uid)
                 .Select(x => x.EncryptedGitHubPat)
                 .FirstOrDefaultAsync()) is string enc
            ? GitProt.Unprotect(enc)
            : null;

    public async Task<(string?, string?)> GetGitHubCredentialsAsync(Guid uid)
    {
        var u = await _db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == uid);
        return u is null
            ? (null, null)
            : (u.EncryptedGitHubPat is null ? null : GitProt.Unprotect(u.EncryptedGitHubPat),
               u.GitHubOwnerRepo);
    }

    public async Task<string> RefreshGitHubWebhookSecretAsync(Guid uid)
    {
        var secret = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
        var u      = await _db.Users.FindAsync(uid) ?? throw new InvalidOperationException("User not found.");
        u.EncryptedGitHubWebhookSecret = HookProt.Protect(secret);
        await _db.SaveChangesAsync();
        return secret;
    }

    public async Task<string?> GetDecryptedGitHubWebhookSecretAsync(Guid uid)
        => (await _db.Users.AsNoTracking()
                 .Where(x => x.Id == uid)
                 .Select(x => x.EncryptedGitHubWebhookSecret)
                 .FirstOrDefaultAsync()) is string enc
            ? HookProt.Unprotect(enc)
            : null;

    /* ───── Azure DevOps ───── */

    public async Task<(bool, string?)> StoreAzurePatAsync(Guid uid, string pat, string org, string project)
    {
        if (!await IsAzurePatValidAsync(pat, org))                      return (false, "Invalid Azure PAT.");
        if (!await IsProjectAccessibleAsync(pat, org, project))        return (false, "PAT lacks access to project.");

        var u = await _db.Users.FindAsync(uid) ?? throw new InvalidOperationException("User not found.");
        u.EncryptedAzurePat = AzProt.Protect(pat);
        u.AzureOrganization = org;
        u.AzureProject      = project;
        u.HasAzureConfig    = true;
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<string?> GetDecryptedAzurePatAsync(Guid uid)
        => (await _db.Users.AsNoTracking()
                 .Where(x => x.Id == uid)
                 .Select(x => x.EncryptedAzurePat)
                 .FirstOrDefaultAsync()) is string enc
            ? AzProt.Unprotect(enc)
            : null;

    public async Task<(string?, string?, string?)> GetAzureCredentialsAsync(Guid uid)
    {
        var u = await _db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == uid);
        return u is null
            ? (null, null, null)
            : (u.EncryptedAzurePat is null ? null : AzProt.Unprotect(u.EncryptedAzurePat),
               u.AzureOrganization,
               u.AzureProject);
    }

    /* ───── validation helpers (public via interface) ───── */

    public Task<bool> IsGitHubPatValidAsync(string pat)
        => HeadOk("https://api.github.com/user", pat, "token");

    public Task<bool> IsOwnerRepoValidAsync(string pat, string ownerRepo)
        => HeadOk($"https://api.github.com/repos/{ownerRepo}", pat, "token");

    public Task<bool> IsAzurePatValidAsync(string pat, string org)
        => HeadOk($"https://dev.azure.com/{org}/_apis/projects?api-version=7.1-preview.4",
                  pat, "Basic", true);

    public Task<bool> IsProjectAccessibleAsync(string pat, string org, string project)
        => HeadOk($"https://dev.azure.com/{org}/{project}/_apis/build/builds?api-version=7.1-preview.7",
                  pat, "Basic", true);

    /* ───── shared HEAD helper ───── */

    async Task<bool> HeadOk(string url, string secret, string scheme, bool isAzure = false)
    {
        try
        {
            var c = _http.CreateClient();
            if (isAzure)
                c.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue(scheme, Convert.ToBase64String(Encoding.ASCII.GetBytes($":{secret}")));
            else
                c.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(scheme, secret);

            c.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("DevOpsDashboard", "1.0"));
            var r = await c.GetAsync(url);
            return r.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "PAT validation error for {Url}", url);
            return false;
        }
    }
}
