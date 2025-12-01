using Devops.Data;
using Devops.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Devops.Controllers;

[ApiController]
[Route("API/account")]
public class AccountController : ControllerBase
{
    private readonly UserManager<DevopsUser> _users;
    private readonly ILogger<AccountController> _logger;

    public AccountController(UserManager<DevopsUser> users, ILogger<AccountController> logger)
    {
        _users = users;
        _logger = logger;
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<DevopsUser.Public>> Me()
    {
        var sub = User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(sub))
        {
            _logger.LogWarning("Me: missing 'sub' claim. Claims: {Claims}", string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}")));
            return Unauthorized();
        }

        var user = await _users.Users.FirstOrDefaultAsync(u => u.HydraSubject == sub);
        if (user == null)
        {
            var email = User.FindFirstValue("email");
            var preferredUsername = User.FindFirstValue("preferred_username");

            if (string.IsNullOrWhiteSpace(email))
                email = $"{sub}@local";

            var username = string.IsNullOrWhiteSpace(preferredUsername) ? email : preferredUsername;

            _logger.LogInformation("Me: creating user for Hydra sub {Sub} with username {Username} and email {Email}", sub, username, email);

            user = new DevopsUser
            {
                UserName = username,
                Email = email,
                HydraSubject = sub
            };

            var create = await _users.CreateAsync(user);
            if (!create.Succeeded)
            {
                var errors = string.Join("; ", create.Errors.Select(e => $"{e.Code}: {e.Description}"));
                _logger.LogError("Me: failed to create user for Hydra sub {Sub}. Errors: {Errors}", sub, errors);
                return Unauthorized();
            }
        }

        return Ok(user.ToPublic());
    }
}

