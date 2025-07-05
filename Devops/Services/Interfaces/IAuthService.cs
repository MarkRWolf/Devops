using Devops.Data;

namespace Devops.Services.Interfaces;

public interface IAuthService
{
    Task<LoginResult> RegisterAsync(string email, string password, string username);
    Task<LoginResult> LoginAsync(string email, string password);
}

public record LoginResult(bool Success, DevopsUser.Public? User, string? Token, IEnumerable<string>? Errors = null);
