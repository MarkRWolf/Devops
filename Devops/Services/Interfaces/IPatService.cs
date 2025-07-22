// Devops/Services/Interfaces/IPatService.cs
namespace Devops.Services.Interfaces;

public interface IPatService
{
    Task<(bool Success, string? Error)> StoreGitHubPatAsync(Guid userId, string pat, string ownerRepo);
    Task<string?> GetDecryptedGitHubPatAsync(Guid userId);
    Task<bool> IsGitHubPatValidAsync(string pat);
    Task<bool> IsOwnerRepoValidAsync(string pat, string ownerRepo);
    Task<(string? DecryptedPat, string? OwnerRepo)> GetGitHubCredentialsAsync(Guid userId);
}