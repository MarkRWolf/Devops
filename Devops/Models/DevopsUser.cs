// DevopsUser.cs
namespace Devops.Data;

using Microsoft.AspNetCore.Identity;

public sealed class DevopsUser : IdentityUser<Guid>
{
    public bool IsAdmin { get; set; }

    /* GitHub stuff */
    public string? EncryptedGitHubPat { get; set; }
    public string? GitHubOwnerRepo { get; set; } 
    public bool HasGitHubConfig { get; set; }
    public string? EncryptedAzureDevOpsToken { get; set; }

    /* DTOs n stuff */
    public record Public(Guid Id, string Email, string Username, bool IsAdmin, bool HasGitHubConfig);
    public Public ToPublic() => new(Id, Email!, UserName!, IsAdmin, HasGitHubConfig);
}
