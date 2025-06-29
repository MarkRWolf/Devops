namespace Devops.Services;

using Devops.Data;
using Devops.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

public sealed class AuthService : IAuthService
{
    private readonly UserManager<DevopsUser> _um;
    private readonly IConfiguration _cfg;

    public AuthService(UserManager<DevopsUser> um, IConfiguration cfg)
        => (_um, _cfg) = (um, cfg);

    public async Task<LoginResult> RegisterAsync(string email, string pw)
    {
        var user = new DevopsUser { UserName = email, Email = email };
        var res = await _um.CreateAsync(user, pw);
        if (!res.Succeeded) return new(false, null, null);

        await _um.AddToRoleAsync(user, "User");
        var token = BuildJwt(user, await _um.GetRolesAsync(user));
        return new(true, user, token);
    }

    public async Task<LoginResult?> LoginAsync(string email, string pw)
    {
        var user = await _um.FindByEmailAsync(email);
        if (user is null || !await _um.CheckPasswordAsync(user, pw)) return null;

        var token = BuildJwt(user, await _um.GetRolesAsync(user));
        return new(true, user, token);
    }

    private string BuildJwt(DevopsUser u, IList<string> roles)
    {
        var issuer = _cfg["JwtSettings:Issuer"]!;     
        var audience = _cfg["JwtSettings:Audience"]!;
        var key = new SymmetricSecurityKey(
                           Encoding.UTF8.GetBytes(_cfg["JwtSettings:Secret"]!));

        var claims = new List<Claim> {
        new("id",    u.Id.ToString()),
        new("email", u.Email!)
    };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(3),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

}
