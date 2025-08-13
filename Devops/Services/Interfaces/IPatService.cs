namespace Devops.Services.Interfaces;

public interface IPatService
{
    /* ───── GitHub ───── */
    Task<(bool Success, string? Error)> StoreGitHubPatAsync(Guid uid, string pat, string ownerRepo);
    Task<string?> GetDecryptedGitHubPatAsync(Guid uid);
    Task<(string? Pat, string? OwnerRepo)> GetGitHubCredentialsAsync(Guid uid);
    Task<string> RefreshGitHubWebhookSecretAsync(Guid uid);
    Task<string?> GetDecryptedGitHubWebhookSecretAsync(Guid uid);

    /* — validation helpers kept public so nothing breaks — */
    Task<bool> IsGitHubPatValidAsync(string pat);
    Task<bool> IsOwnerRepoValidAsync(string pat, string ownerRepo);

    /* ───── Azure DevOps ───── */
    Task<(bool Success, string? Error)> StoreAzurePatAsync(Guid uid, string pat, string org, string project);
    Task<string?> GetDecryptedAzurePatAsync(Guid uid);
    Task<(string? Pat, string? Org, string? Project)> GetAzureCredentialsAsync(Guid uid);

    /* — Azure validation helpers — */
    Task<bool> IsAzurePatValidAsync(string pat, string org);
    Task<bool> IsProjectAccessibleAsync(string pat, string org, string project);
    
    Task<string>  RefreshAzureWebhookSecretAsync(Guid uid);
    Task<string?> GetDecryptedAzureWebhookSecretAsync(Guid uid);
}
