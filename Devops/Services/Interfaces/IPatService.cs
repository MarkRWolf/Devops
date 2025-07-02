// Devops/Devops.Services.Interfaces/IPatService.cs
namespace Devops.Services.Interfaces;

public interface IPatService
{
    Task<(bool isValid, string? errorMessage)> ValidateAndStorePat(string userId, string pat, string patType);
}