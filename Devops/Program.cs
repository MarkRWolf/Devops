using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Devops.Data;
using Devops.Services;
using Devops.Services.Interfaces;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.DataProtection;
using System.Text.Json;
using Azure.Identity;


var builder = WebApplication.CreateBuilder(args);
var cfg = builder.Configuration;
var svc = builder.Services;

// ───── LOGGING  ────────────
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

// ───── BUILDING  ──────────────────────────────────────────────────────────
Console.WriteLine("KESTREL: Application builder created.");

// ─────  DATABASE  ───────────────────────────────────────────────────────────────
svc.AddDbContext<DevopsDb>(o =>
    o.UseSqlServer(cfg.GetConnectionString("DevopsDB")));

// ─────  IDENTITY  ────────────────────────────────────    ───────────────────────────
svc.AddIdentityCore<DevopsUser>(o => o.Password.RequireNonAlphanumeric = false)
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<DevopsDb>();

// ─────  DATA PROTECTION  ───────────────────────────
var blobUri = cfg["AzureBlob:KeyUri"];
if (!string.IsNullOrEmpty(blobUri))
{
    var credential = new DefaultAzureCredential();
    svc.AddDataProtection()
        .SetApplicationName("Devops")
        .PersistKeysToAzureBlobStorage(new Uri(blobUri), credential);
}
else
{
    svc.AddDataProtection()
        .SetApplicationName("Devops")
        .PersistKeysToFileSystem(new DirectoryInfo("/app/dpkeys"));
}

// ─────  JWT  ────────────────────────────────────────────────────────────────────
var key = Encoding.UTF8.GetBytes(cfg["JwtSettings:Secret"]!);
svc.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var logger = ctx.HttpContext.RequestServices.GetRequiredService<ILogger<JwtBearerEvents>>();
                if (ctx.Request.Cookies.TryGetValue("DevopsUserToken", out var tok))
                {
                   ctx.Token = tok;
                }
                return Task.CompletedTask;
            },
            OnAuthenticationFailed = ctx =>
            {
                var logger = ctx.HttpContext.RequestServices.GetRequiredService<ILogger<JwtBearerEvents>>();
                logger.LogError(ctx.Exception, "JWT authentication failed → {ExceptionType} – {ExceptionMessage}",
                    ctx.Exception.GetType().Name, ctx.Exception.Message);
                return Task.CompletedTask;
            },
            OnTokenValidated = ctx =>
            {
                var logger = ctx.HttpContext.RequestServices.GetRequiredService<ILogger<JwtBearerEvents>>();
                logger.LogInformation("JWT OK → user id {UserId}",
                    ctx.Principal!.FindFirst("id")?.Value);
                return Task.CompletedTask;
            }
        };

        var issuer = cfg["JwtSettings:Issuer"] ?? throw new Exception("Issuer missing");
        var audience = cfg["JwtSettings:Audience"] ?? throw new Exception("Audience missing");

        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),

            ValidateIssuer = true,
            ValidIssuer = issuer,

            ValidateAudience = true,
            ValidAudience = audience,

            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(2)
        };
    });

    // Add CORS services
    svc.AddCors(options =>
    {
        options.AddPolicy(name: "local",
                             builder =>
                             {
                                 builder.WithOrigins("http://localhost:3000")
                                     .AllowAnyHeader()
                                     .AllowAnyMethod()
                                     .AllowCredentials();
                             });
    });

svc.AddAuthorization();
svc.AddScoped<IAuthService, AuthService>();
svc.AddScoped<IPatService, PatService>();
svc.AddScoped<IGitHubService, GitHubService>();
svc.AddHttpClient();
svc.AddLogging(); 

builder.Services.AddControllers()
       .AddJsonOptions(o =>
           o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase);

svc.AddHealthChecks(); 

svc.Configure<IdentityOptions>(o =>
{
    o.User.RequireUniqueEmail = true;
});


builder.WebHost.ConfigureKestrel(o => o.AddServerHeader = false);

var app = builder.Build();
Console.WriteLine("KESTREL: Application building complete, starting to run...");

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

/* ---------- CREATE DB + TABLES ---------- */
await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DevopsDb>();
    await db.Database.MigrateAsync();
}

// ─────  ROLE SEED  ──────────────────────────────────────────────────────────────
await using (var scope = app.Services.CreateAsyncScope())
{
    var rm = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
    foreach (var r in new[] { "User", "Admin" })
        if (!await rm.RoleExistsAsync(r))
            await rm.CreateAsync(new IdentityRole<Guid>(r));
}

// ─────  PIPELINE  ───────────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseCors("local"); 
}
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health"); // for azures internal health check
app.MapHealthChecks("/API/health");  // client is served from /API in dev & container & ACR

app.MapControllers();

app.Run();

public partial class Program{}