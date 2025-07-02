// Devops/Devops.Services/PatService.cs
namespace Devops.Services;

using Microsoft.AspNetCore.Identity;
using Devops.Data;
using Devops.Services.Interfaces;
using System.Text;
using Microsoft.AspNetCore.DataProtection;
using System.Net.Http.Headers;
using System.Net.Http; 

public class PatService : IPatService
{
    private readonly UserManager<DevopsUser> _userManager;
    private readonly HttpClient _httpClient;
    private readonly IDataProtector _dataProtector;

    public PatService(
        UserManager<DevopsUser> userManager,
        HttpClient httpClient,
        IDataProtectionProvider dataProtectionProvider)
    {
        _userManager = userManager;
        _httpClient = httpClient;
        _dataProtector = dataProtectionProvider.CreateProtector("PatProtection");
    }

    public async Task<(bool isValid, string? errorMessage)> ValidateAndStorePat(string userId, string pat, string patType)
    {
        var (isValid, errorMessage) = (false, "Unsupported PAT type.");

        if (patType.Equals("github", StringComparison.OrdinalIgnoreCase))
        {
            (isValid, errorMessage) = await ValidateGitHubPat(pat);
        }
        else if (patType.Equals("azuredevops", StringComparison.OrdinalIgnoreCase))
        {
            (isValid, errorMessage) = await ValidateAzureDevOpsPat(pat);
        }

        if (!isValid) return (false, errorMessage);

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return (false, "User not found.");

        var encryptedPat = _dataProtector.Protect(pat);

        if (patType.Equals("github", StringComparison.OrdinalIgnoreCase))
        {
            user.EncryptedGitHubPat = encryptedPat;
        }
        else if (patType.Equals("azuredevops", StringComparison.OrdinalIgnoreCase))
        {
            user.EncryptedAzureDevOpsToken = encryptedPat;
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded) return (false, "Failed to save PAT.");

        return (true, null);
    }

    private async Task<(bool isValid, string? errorMessage)> ValidateGitHubPat(string pat)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Token", pat);
            _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("DevopsMonitoringDashboard");

            var response = await _httpClient.GetAsync("https://api.github.com/user");
            if (response.IsSuccessStatusCode)
            {
                return (true, null);
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                return (false, $"GitHub PAT validation failed: {response.ReasonPhrase} - {errorContent}");
            }
        }
        catch (HttpRequestException ex)
        {
            return (false, $"Network error during GitHub PAT validation: {ex.Message}");
        }
        catch (Exception ex)
        {
            return (false, $"Error validating GitHub PAT: {ex.Message}");
        }
    }

    private async Task<(bool isValid, string? errorMessage)> ValidateAzureDevOpsPat(string pat)
    {
        try
        {
            var authToken = Convert.ToBase64String(Encoding.ASCII.GetBytes($":{pat}"));
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", authToken);

            var response = await _httpClient.GetAsync("https://app.vssps.visualstudio.com/_apis/profile/profiles/me?api-version=6.0");
            if (response.IsSuccessStatusCode)
            {
                return (true, null);
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                return (false, $"Azure DevOps PAT validation failed: {response.ReasonPhrase} - {errorContent}");
            }
        }
        catch (HttpRequestException ex)
        {
            return (false, $"Network error during Azure DevOps PAT validation: {ex.Message}");
        }
        catch (Exception ex)
        {
            return (false, $"Error validating Azure DevOps PAT: {ex.Message}");
        }
    }
}