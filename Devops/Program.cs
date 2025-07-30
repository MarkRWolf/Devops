// Program.cs
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;
using Azure.Identity;
using Devops.Data;
using Devops.Hubs;
using Devops.Services;
using Devops.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);
var cfg = builder.Configuration;
var svc = builder.Services;

// ───── LOGGING ─────────────────────────────────
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

// ───── DATABASE ──────────────────────────────
svc.AddDbContext<DevopsDb>(opt =>
{
    if (cfg.GetValue<bool>("UseSqliteForTests"))
        opt.UseSqlite(cfg.GetConnectionString("DevopsDB"));
    else
        opt.UseSqlServer(cfg.GetConnectionString("DevopsDB"));
});

// ───── IDENTITY ──────────────────────────────
svc.AddIdentityCore<DevopsUser>(o => o.Password.RequireNonAlphanumeric = false)
   .AddRoles<IdentityRole<Guid>>()
   .AddEntityFrameworkStores<DevopsDb>();

// ───── DATA PROTECTION ───────────────────────
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

// ───── JWT & AUTHENTICATION ─────────────────
var key = Encoding.UTF8.GetBytes(cfg["JwtSettings:Secret"]!);
svc.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
   .AddJwtBearer(o =>
   {
       o.Events = new JwtBearerEvents
       {
           OnMessageReceived = ctx =>
           {
               if (ctx.Request.Cookies.TryGetValue("DevopsUserToken", out var tok))
                   ctx.Token = tok;
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
               logger.LogInformation("JWT OK → user id {UserId}", ctx.Principal!.FindFirst("id")?.Value);
               return Task.CompletedTask;
           }
       };

       o.TokenValidationParameters = new TokenValidationParameters
       {
           ValidateIssuerSigningKey = true,
           IssuerSigningKey = new SymmetricSecurityKey(key),
           ValidateIssuer = true,
           ValidIssuer = cfg["JwtSettings:Issuer"]!,
           ValidateAudience = true,
           ValidAudience = cfg["JwtSettings:Audience"]!,
           ValidateLifetime = true,
           ClockSkew = TimeSpan.FromMinutes(2)
       };
   });

// ───── CORS ─────────────────────────────────
svc.AddCors(options =>
{
    options.AddPolicy("Local", policy =>
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());

    options.AddPolicy("Production", policy =>
        policy.WithOrigins("https://webhookrelay.thankfulglacier-8f9db822.northeurope.azurecontainerapps.io")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

// ───── AUTHORIZATION & SIGNALR ──────────────
svc.AddAuthorization();
svc.AddSignalR();

// ───── APPLICATION SERVICES ─────────────────
svc.AddScoped<IAuthService, AuthService>();
svc.AddScoped<IPatService, PatService>();
svc.AddScoped<IGitHubService, GitHubService>();
svc.AddHttpClient();
svc.AddLogging();

svc.AddControllers()
   .AddJsonOptions(o => o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase);

svc.AddHealthChecks();

var app = builder.Build();

// ───── FORWARDED HEADERS ────────────────────
var forwardedOptions = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor
                     | ForwardedHeaders.XForwardedProto
                     | ForwardedHeaders.XForwardedHost
};
forwardedOptions.KnownNetworks.Clear();
forwardedOptions.KnownProxies.Clear();
app.UseForwardedHeaders(forwardedOptions);

// ───── CORS, AUTH, ROUTING ─────────────────
if (app.Environment.IsDevelopment())
    app.UseCors("Local");
else
    app.UseCors("Production");

app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");
app.MapHealthChecks("/API/health");

app.MapHub<WorkflowHub>("/WS/workflowHub")
   .RequireCors(app.Environment.IsDevelopment() ? "Local" : "Production");

app.MapControllers();

app.Run();

public partial class Program { }
