namespace Devops.Controllers;

using Devops.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.AspNetCore.Hosting;

[ApiController]
[Route("API/account")]
public class AccountController(IAuthService auth, IConfiguration cfg, IWebHostEnvironment env) : ControllerBase
{
    public record SignupReq(string Email, string Password, string UserName);
    public record Req(string Email, string Password);

    private CookieOptions CookieOpts => new()
    {
        HttpOnly = true,
        SameSite = SameSiteMode.Lax,
        Secure = !env.IsDevelopment(),
        Expires = DateTime.UtcNow.AddDays(30)
    };

    [HttpPost("signup")]
        public async Task<IActionResult> Register([FromBody] SignupReq r)
        {
            var res = await auth.RegisterAsync(r.Email, r.Password, r.UserName);
            if (!res.Success)
                return Conflict(new { errors = res.Errors });  

            Response.Cookies.Append("TestToken", res.Token!, CookieOpts);
            return CreatedAtAction(nameof(Me),
                null,
                new { res.User!.Id, res.User.Email, res.User.UserName });
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

