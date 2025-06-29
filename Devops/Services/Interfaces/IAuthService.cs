using Devops.Data;

namespace Devops.Services.Interfaces;

public interface IAuthService
{
    Task<LoginResult> RegisterAsync(string email, string password);
    Task<LoginResult?> LoginAsync(string email, string password);
}

public record LoginResult(bool Success, DevopsUser? User, string? Token);
