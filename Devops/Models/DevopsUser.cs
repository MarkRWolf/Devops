// DevopsUser.cs
namespace Devops.Data;

using Microsoft.AspNetCore.Identity;

public sealed class DevopsUser : IdentityUser<Guid>
{
    public required new string Email { get; set; } = default!;
    public required new string UserName { get; set; } = default!;
    public bool IsAdmin { get; set; }

    public string? EncryptedGitHubPat { get; set; }
    public string? EncryptedAzureDevOpsToken { get; set; }
    public record Public(Guid Id, string Email, string Username, bool IsAdmin);
    public Public ToPublic() => new(Id, Email, UserName, IsAdmin);
}
