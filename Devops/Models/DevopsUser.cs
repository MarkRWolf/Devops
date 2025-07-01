// DevopsUser.cs
namespace Devops.Data;

using Microsoft.AspNetCore.Identity;

public class DevopsUser : IdentityUser<Guid> 
{
    public bool IsAdmin { get; set; }

    public string? EncryptedGitHubPat { get; set; }
    public string? EncryptedAzureDevOpsToken { get; set; }
}