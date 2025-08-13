namespace Devops.Data;

using Microsoft.AspNetCore.Identity;

public sealed class DevopsUser : IdentityUser<Guid>
{
    public bool IsAdmin { get; set; }

    public string? EncryptedGitHubPat { get; set; }
    public string? GitHubOwnerRepo { get; set; } 
    public string? EncryptedGitHubWebhookSecret { get; set; }
    public bool HasGitHubConfig { get; set; }

    public string? EncryptedAzurePat { get; set; }
    public string? AzureOrganization { get; set; }
    public string? AzureProject { get; set; }
    public string? EncryptedAzureWebhookSecret { get; set; }
    public bool HasAzureConfig { get; set; }

    public record Public(
        Guid Id,
        string Email,
        string Username,
        bool IsAdmin,
        bool HasGitHubConfig,
        bool HasAzureConfig);

    public Public ToPublic() =>
        new(Id, Email!, UserName!, IsAdmin, HasGitHubConfig, HasAzureConfig);
}
