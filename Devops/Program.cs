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
using Devops.Hubs;
using System.Net;
using Prometheus;
using OpenTelemetry;
using OpenTelemetry.Trace;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Logs;
using OpenTelemetry.Instrumentation.SqlClient;

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
var explicitKeysDir = Environment.GetEnvironmentVariable("DP_KEYS_DIR");

if (!string.IsNullOrWhiteSpace(blobUri))
{
    // PROD: Azure Blob
    var credential = new DefaultAzureCredential();
    svc.AddDataProtection()
       .SetApplicationName("Devops")
       .PersistKeysToAzureBlobStorage(new Uri(blobUri), credential);
}
else if (!string.IsNullOrWhiteSpace(explicitKeysDir))
{
    // DOCKER/COMPOSE
    Directory.CreateDirectory(explicitKeysDir);
    svc.AddDataProtection()
       .SetApplicationName("Devops")
       .PersistKeysToFileSystem(new DirectoryInfo(explicitKeysDir));
}
else
{
    // LOCAL DEV
    var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
    var keysPath = string.IsNullOrWhiteSpace(localAppData)
        ? Path.Combine(AppContext.BaseDirectory, "dpkeys")
        : Path.Combine(localAppData, "Devops", "dpkeys");

    Directory.CreateDirectory(keysPath);
    svc.AddDataProtection()
       .SetApplicationName("Devops")
       .PersistKeysToFileSystem(new DirectoryInfo(keysPath));
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
               logger.LogError(ctx.Exception, "JWT authentication failed → {ExceptionType} - {ExceptionMessage}",
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

// ───── Define CORS ─────────────────────────────────
svc.AddCors(options =>
{
    options.AddPolicy(name: "Local", 
        builder => builder
            .WithOrigins("http://localhost:3000", "http://localhost:80")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());

    options.AddPolicy(name: "Production",
        builder => builder
            .WithOrigins("https://webhookrelay.thankfulglacier-8f9db822.northeurope.azurecontainerapps.io", "https://devops.mark-wolf.com", "https://devoptics.mark-wolf.com", "https://128.251.90.182")
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
svc.AddScoped<IAzureDevOpsService, AzureDevOpsService>();
svc.AddHttpClient();
svc.AddHttpClient("github")
   .ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
   {
       AutomaticDecompression = DecompressionMethods.All
   });
svc.AddLogging();
svc.AddMemoryCache();

svc.AddControllers()
   .AddJsonOptions(o => o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase);

svc.AddHealthChecks();

// ───── OpenTelemetry ─────────────────
var otelBase = cfg["OTEL_COLLECTOR_ENDPOINT"] ?? "http://otel-collector:4318";
builder.Services.AddOpenTelemetry()
.WithTracing(tp =>
{
    tp.AddAspNetCoreInstrumentation()
    .AddHttpClientInstrumentation()
    .AddSqlClientInstrumentation()
    .AddOtlpExporter(options =>
    {
        options.Endpoint = new Uri(otelBase + "/v1/traces");
        options.Protocol = OpenTelemetry.Exporter.OtlpExportProtocol.HttpProtobuf;
    });
})
.WithMetrics(mp =>
{
    mp.AddAspNetCoreInstrumentation()
    .AddRuntimeInstrumentation()
    .AddHttpClientInstrumentation()
    .AddOtlpExporter(options =>
    {
        options.Endpoint = new Uri(otelBase + "/v1/metrics");
        options.Protocol = OpenTelemetry.Exporter.OtlpExportProtocol.HttpProtobuf;
    });
});

builder.Logging.AddOpenTelemetry(options =>
{
    options.IncludeScopes = true;
    options.IncludeFormattedMessage = true;
    options.ParseStateValues = true;
    options.SetResourceBuilder(ResourceBuilder.CreateDefault().AddService("Devops"));
    options.AddOtlpExporter(o =>
    {
        o.Endpoint = new Uri(otelBase + "/v1/logs");
        o.Protocol = OpenTelemetry.Exporter.OtlpExportProtocol.HttpProtobuf;
    });
});


var app = builder.Build();


// Advanced signalR logging if needed
/*
app.Use(async (context, next) =>
{
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
*/

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


app.UseHttpMetrics();
app.MapMetrics();

app.MapControllers();

app.MapGet("/testlog", (ILogger<Program> logger) =>
{
    logger.LogInformation("This is a test log for Loki");
    return Results.Ok("Log emitted");
});

app.Run();

public partial class Program { }
