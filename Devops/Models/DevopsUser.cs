// DevopsUser.cs
namespace Devops.Data;

using Microsoft.AspNetCore.Identity;

public sealed class DevopsUser : IdentityUser<Guid>
{
    public bool IsAdmin { get; set; }

    public string? EncryptedGitHubPat { get; set; }
    public string? GitHubOwnerRepo { get; set; }
    public string? EncryptedAzureDevOpsToken { get; set; }
    public record Public(Guid Id, string Email, string Username, bool IsAdmin);
    public Public ToPublic() => new(Id, Email!, UserName!, IsAdmin);
}
