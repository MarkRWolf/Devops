namespace Devops.Controllers;

using System.Net;
using Devops.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.AspNetCore.Hosting;
using Devops.Data;
using Microsoft.AspNetCore.Identity;

[ApiController]
[Route("API/account")]
public class AccountController(IAuthService auth, IConfiguration cfg, IWebHostEnvironment env, UserManager<DevopsUser> userManager) : ControllerBase
{
    public record SignupReq(string Email, string Password, string Username);
    public record Req(string Email, string Password);

   private CookieOptions CookieOpts(IWebHostEnvironment env) => new()
    {
        HttpOnly = true,
        SameSite = env.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.None,
        Secure = !env.IsDevelopment(),
        Expires = DateTime.UtcNow.AddDays(30),
        Path = "/"
    };


[HttpPost("signup")]
    public async Task<IActionResult> Register([FromBody] SignupReq r, [FromServices] IEmailSender email)
    {
        var res = await auth.RegisterAsync(r.Email, r.Password, r.Username);
        if (!res.Success || res.User is null)
            return Conflict(new { errors = res.Errors });

        var user = await userManager.FindByEmailAsync(r.Email);
        if (user == null)
            return BadRequest("User creation failed.");

        var token = await userManager.GenerateEmailConfirmationTokenAsync(user);
        var encoded = WebUtility.UrlEncode(token);

        var apiBase = cfg["App:ApiBaseUrl"] ?? $"{Request.Scheme}://{Request.Host}";
        var confirmUrl = $"{apiBase}/API/account/confirm-email?userId={user.Id}&token={encoded}";

        var body = $"Click <a href=\"{confirmUrl}\">here</a> to confirm your email.";
        await email.SendAsync(user.Email!, "Confirm your email", body);

        return StatusCode(201, new { res.User, Message = "User registered. Check your email to confirm your account." });
    }

    [HttpGet("confirm-email")]
    public async Task<IActionResult> ConfirmEmail(Guid userId, string token)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return NotFound("User not found.");

        var result = await userManager.ConfirmEmailAsync(user, token);

        if (!result.Succeeded)
            return BadRequest("Invalid or expired token.");

        return Ok(new { Message = "Email confirmed successfully." });
    }


    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] Req r)
    {
        var res = await auth.LoginAsync(r.Email, r.Password);
        if (res is null || res.User is null) return Unauthorized(new { errors = new[] { "Invalid credentials." } });
        Response.Cookies.Append("DevopsUserToken", res.Token!, CookieOpts(env));
        return Ok(new { res.User, Message = "Login successful." });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("DevopsUserToken", new CookieOptions
        {
            Path = "/",
            Secure = true,
            SameSite = SameSiteMode.None
        });

        return Ok(new { Message = "Logged out successfully." });
    }


    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<DevopsUser.Public>> Me()
    {
        var userIdClaim = User.FindFirstValue("id");
        if(!Guid.TryParse(userIdClaim, out var userId)) return Unauthorized("Invalid user ID.");        

        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            return NotFound("User not found.");
        }

        return Ok(user.ToPublic());
    }
}

