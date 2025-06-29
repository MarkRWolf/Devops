namespace Devops.Controllers;

using Devops.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.AspNetCore.Hosting;

[ApiController]
[Route("api/account")]
public class AccountController(IAuthService auth, IConfiguration cfg, IWebHostEnvironment env) : ControllerBase
{
    public record Req(string Email, string Password);

    private CookieOptions CookieOpts => new()
    {
        HttpOnly = true,
        SameSite = SameSiteMode.Lax,
        Secure = !env.IsDevelopment(),
        Expires = DateTime.UtcNow.AddDays(30)
    };

    [HttpPost("signup")]
    public async Task<IActionResult> Register([FromBody] Req r)
    {
        var res = await auth.RegisterAsync(r.Email, r.Password);
        if (!res.Success) return Conflict("Email exists.");
        Response.Cookies.Append("TestToken", res.Token!, CookieOpts);
        return Created("/api/account/me", new { res.User!.Id, res.User.Email });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] Req r)
    {
        var res = await auth.LoginAsync(r.Email, r.Password);
        if (res is null) return Unauthorized("Invalid credentials.");
        Response.Cookies.Append("TestToken", res.Token!, CookieOpts);
        return Ok(new { res.User!.Id, res.User.Email });
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me() => Ok(new
    {
        Id = User.FindFirstValue("id"),
        Email = User.FindFirstValue(ClaimTypes.Email),
    });
}
