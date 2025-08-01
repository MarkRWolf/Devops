// Devops/Services/Interfaces/IPatService.cs
namespace Devops.Services.Interfaces;

public interface IPatService
{
    /* Store PAT */
    Task<(bool Success, string? Error)> StoreGitHubPatAsync(Guid userId, string pat, string ownerRepo);
    /* Decrypt PAT */
    Task<string?> GetDecryptedGitHubPatAsync(Guid userId);
    /* Validate - is Pat valid */
    Task<bool> IsGitHubPatValidAsync(string pat);
    /* Validate - is Owner/Repo valid */
    Task<bool> IsOwnerRepoValidAsync(string pat, string ownerRepo);
    /* Get GitHub credentials */
    Task<(string? DecryptedPat, string? OwnerRepo)> GetGitHubCredentialsAsync(Guid userId);

    /* Webhook secret */
    Task<string> RefreshGitHubWebhookSecretAsync(Guid userId);
    Task<string?> GetDecryptedGitHubWebhookSecretAsync(Guid userId);
}