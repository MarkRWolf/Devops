namespace Devops.Controllers;

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

    private CookieOptions CookieOpts => new()
    {
        HttpOnly = true,
        SameSite = SameSiteMode.None,
        Secure = true,
        Expires = DateTime.UtcNow.AddDays(30)
    };

    [HttpPost("signup")]
        public async Task<IActionResult> Register([FromBody] SignupReq r)
        {
            var res = await auth.RegisterAsync(r.Email, r.Password, r.Username);
            if (!res.Success || res.User is null)
                return Conflict(new { errors = res.Errors });  

            Response.Cookies.Append("DevopsUserToken", res.Token!, CookieOpts);
            return StatusCode(201, new { res.User, Message = "User registered successfully." });
        }


    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] Req r)
    {
        var res = await auth.LoginAsync(r.Email, r.Password);
        if (res is null || res.User is null) return Unauthorized(new { errors = new[] { "Invalid credentials." } });
        Response.Cookies.Append("DevopsUserToken", res.Token!, CookieOpts);
        return Ok(new { res.User, Message = "Login successful." });
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

