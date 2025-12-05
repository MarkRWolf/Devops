using System.Security.Claims;
using System.Text.Json;
using Devops.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Devops.Controllers;

[ApiController]
[Route("API/account")]
public class AccountController : ControllerBase
{
    private readonly UserManager<DevopsUser> _users;
    private readonly ILogger<AccountController> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    public AccountController(
        UserManager<DevopsUser> users,
        ILogger<AccountController> logger,
        IHttpClientFactory httpClientFactory)
    {
        _users = users;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
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
            var kratosAdminBase = Environment.GetEnvironmentVariable("KRATOS_ADMIN_URL") ?? "http://kratos:4434";
            var client = _httpClientFactory.CreateClient();
            HttpResponseMessage resp;

            try
            {
                resp = await client.GetAsync($"{kratosAdminBase}/admin/identities/{sub}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Me: failed to call Kratos admin for sub {Sub}", sub);
                return Unauthorized();
            }

            if (!resp.IsSuccessStatusCode)
            {
                _logger.LogError("Me: Kratos admin returned {StatusCode} for sub {Sub}", resp.StatusCode, sub);
                return Unauthorized();
            }

            string email = null;
            string preferredUsername = null;

            try
            {
                var content = await resp.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(content);
                var root = doc.RootElement;

                if (root.TryGetProperty("traits", out var traits))
                {
                    if (traits.TryGetProperty("email", out var emailProp) && emailProp.ValueKind == JsonValueKind.String)
                        email = emailProp.GetString();

                    if (traits.TryGetProperty("username", out var usernameProp) && usernameProp.ValueKind == JsonValueKind.String)
                        preferredUsername = usernameProp.GetString();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Me: failed to parse Kratos identity for sub {Sub}", sub);
                return Unauthorized();
            }

            if (string.IsNullOrWhiteSpace(email))
            {
                _logger.LogError("Me: Kratos identity for sub {Sub} has no email trait", sub);
                return Unauthorized();
            }

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

