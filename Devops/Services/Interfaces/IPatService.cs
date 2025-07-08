namespace Devops.Services.Interfaces;

public interface IPatService
{
    Task<(bool Success, string? Error)> StoreGitHubPatAsync(Guid userId, string pat);
    Task<string?> GetDecryptedGitHubPatAsync(Guid userId);
    Task<bool> IsGitHubPatValidAsync(string pat);
}