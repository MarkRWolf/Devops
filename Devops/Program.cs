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
using Devops.Hubs; // SignalR hub namespace

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
    options.AddPolicy(name: "Local", // Changed policy name to "Local" for consistency
        builder => builder
            .WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());

    // ADDED Production CORS Policy
    options.AddPolicy(name: "Production",
        builder => builder
            .WithOrigins("https://webhookrelay.thankfulglacier-8f9db822.northeurope.azurecontainerapps.io")
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

app.Use(async (context, next) =>
{
    // Log all requests for the SignalR path, regardless of method
    if (context.Request.Path.StartsWithSegments("/WS/workflowHub"))
    {
        app.Logger.LogDebug("--- SignalR DEBUG Request START ---");
        app.Logger.LogDebug("Method: {Method}", context.Request.Method);
        app.Logger.LogDebug("Path: {Path}", context.Request.Path);
        app.Logger.LogDebug("QueryString: {QueryString}", context.Request.QueryString);
        app.Logger.LogDebug("Host Header: {Host}", context.Request.Headers["Host"].ToString());
        app.Logger.LogDebug("X-Forwarded-Proto: {XForwardedProto}", context.Request.Headers["X-Forwarded-Proto"].ToString());
        app.Logger.LogDebug("X-Forwarded-For: {XForwardedFor}", context.Request.Headers["X-Forwarded-For"].ToString());
        app.Logger.LogDebug("--- SignalR DEBUG Request END ---");
    }
    await next(context);
});

app.Use(async (context, next) =>
{
    context.Request.EnableBuffering();
    await next();
});

// ───── DATABASE MIGRATIONS & SEED ──────────
await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DevopsDb>();
    if (cfg.GetValue<bool>("UseSqliteForTests"))
        await db.Database.EnsureCreatedAsync();
    else
        await db.Database.MigrateAsync();
}

await using (var scope = app.Services.CreateAsyncScope())
{
    var rm = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
    foreach (var r in new[] { "User", "Admin" })
        if (!await rm.RoleExistsAsync(r))
            await rm.CreateAsync(new IdentityRole<Guid>(r));
}

// ───── HTTP PIPELINE ────────────────────────
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

// Use CORS policy based on environment
if (app.Environment.IsDevelopment())
    app.UseCors("Local"); // Use "Local" policy in Development
else
    app.UseCors("Production"); // Use "Production" policy otherwise (e.g., in Azure)

app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");
app.MapHealthChecks("/API/health");

// Apply CORS to SignalR Hub conditionally based on environment
app.MapHub<WorkflowHub>("/WS/workflowHub")
    .RequireCors(app.Environment.IsDevelopment() ? "Local" : "Production"); // Apply correct CORS policy
app.MapControllers();

// ───── SIGNALR HUB ─────────────────────────

app.Run();

public partial class Program { }