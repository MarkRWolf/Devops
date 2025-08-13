using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace Devops.Controllers.Auth
{
    [ApiController]
    [Route("API/auth")]
    public class AuthController(IConfiguration cfg) : ControllerBase
    {
        [HttpGet("hub-token")]
        [Authorize]
        public IActionResult GetHubToken()
        {
            var id = User.FindFirstValue("id") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cfg["JwtSettings:Secret"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var jwt = new JwtSecurityToken(
                issuer: cfg["JwtSettings:Issuer"],
                audience: cfg["JwtSettings:Audience"],
                claims: [ new Claim("id", id) ],
                notBefore: DateTime.UtcNow,
                expires: DateTime.UtcNow.AddMinutes(5),
                signingCredentials: creds);
            var token = new JwtSecurityTokenHandler().WriteToken(jwt);
            return Ok(new { token });
        }
    }
}
