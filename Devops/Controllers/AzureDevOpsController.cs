// Devops/Controllers/AzureDevOpsController.cs
namespace Devops.Controllers
{
    using Devops.Models;
    using Devops.Services.Interfaces;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.Extensions.Configuration;
    using System;
    using System.Collections.Generic;
    using System.Security.Claims;
    using System.Threading.Tasks;

    [ApiController]
    [Route("API/azure")]
    public class AzureDevOpsController : ControllerBase
    {
        private readonly IAzureDevOpsService _svc;
        private readonly string? _org;
        private readonly string? _proj;
        private readonly string? _pat;

        public AzureDevOpsController(IAzureDevOpsService svc, IConfiguration cfg)
        {
            _svc = svc;
            _org = cfg["Azure:ProjectOrganization"];
            _proj = cfg["Azure:ProjectName"];
            _pat = cfg["Azure:ProjectPat"];
        }

        /* ───────────── USER-SCOPED (AUTH) ───────────── */

        [Authorize]
        [HttpGet("builds")]
        public async Task<ActionResult<List<AzureBuild>>> GetBuilds()
        {
            var uid = UserId();
            if (uid is null) return Unauthorized();

            var builds = await _svc.GetBuildsAsync(uid.Value);
            return builds is null
                ? StatusCode(500, "Failed to retrieve builds.")
                : Ok(builds);
        }

        [Authorize]
        [HttpGet("builds/{id}")]
        public async Task<ActionResult<AzureBuild>> GetBuild(int id)
        {
            var uid = UserId();
            if (uid is null) return Unauthorized();

            var build = await _svc.GetBuildAsync(uid.Value, id);
            return build is null ? NotFound() : Ok(build);
        }

        [Authorize]
        [HttpGet("builds/{id}/timeline")]
        public async Task<ActionResult<List<AzureJob>>> Timeline(int id)
        {
            var uid = UserId();
            if (uid is null) return Unauthorized();

            var timeline = await _svc.GetBuildTimelineAsync(uid.Value, id);
            return timeline is null ? StatusCode(500) : Ok(timeline);
        }

        [Authorize]
        [HttpGet("builds/{id}/artifacts")]
        public async Task<ActionResult<List<AzureArtifact>>> Artifacts(int id)
        {
            var uid = UserId();
            if (uid is null) return Unauthorized();

            var artifacts = await _svc.GetBuildArtifactsAsync(uid.Value, id);
            return artifacts is null ? StatusCode(500) : Ok(artifacts);
        }

        [Authorize]
        [HttpGet("builds/{id}/logs")]
        public async Task<ActionResult> Logs(int id)
        {
            var uid = UserId();
            if (uid is null) return Unauthorized();

            var file = await _svc.DownloadBuildLogsAsync(uid.Value, id);
            return file is null
                ? NotFound()
                : File(file.Content, file.ContentType, file.FileName);
        }

        [Authorize]
        [HttpGet("artifacts")]
        public async Task<ActionResult> Artifact([FromQuery] string url)
        {
            var uid = UserId();
            if (uid is null) return Unauthorized();

            var file = await _svc.DownloadArtifactAsync(uid.Value, url);
            return file is null
                ? NotFound()
                : File(file.Content, file.ContentType, file.FileName);
        }

        /* ───────────── PROJECT-SCOPED (ANON) ───────────── */

        [AllowAnonymous]
        [HttpGet("project/builds")]
        public async Task<ActionResult<List<AzureBuild>>> ProjectBuilds()
        {
            if (_org is null || _proj is null || _pat is null) return StatusCode(503);

            var builds = await _svc.GetBuildsWithPatAsync(_org, _proj, _pat);
            return builds is null ? StatusCode(500) : Ok(builds);
        }

        [AllowAnonymous]
        [HttpGet("project/builds/{id}")]
        public async Task<ActionResult<AzureBuild>> ProjectBuild(int id)
        {
            if (_org is null || _proj is null || _pat is null) return StatusCode(503);

            var build = await _svc.GetBuildWithPatAsync(_org, _proj, id, _pat);
            return build is null ? NotFound() : Ok(build);
        }

        [AllowAnonymous]
        [HttpGet("project/builds/{id}/timeline")]
        public async Task<ActionResult<List<AzureJob>>> ProjectTimeline(int id)
        {
            if (_org is null || _proj is null || _pat is null) return StatusCode(503);

            var timeline = await _svc.GetBuildTimelineWithPatAsync(_org, _proj, id, _pat);
            return timeline is null ? StatusCode(500) : Ok(timeline);
        }

        [AllowAnonymous]
        [HttpGet("project/builds/{id}/artifacts")]
        public async Task<ActionResult<List<AzureArtifact>>> ProjectArtifacts(int id)
        {
            if (_org is null || _proj is null || _pat is null) return StatusCode(503);

            var artifacts = await _svc.GetBuildArtifactsWithPatAsync(_org, _proj, id, _pat);
            return artifacts is null ? StatusCode(500) : Ok(artifacts);
        }

        [AllowAnonymous]
        [HttpGet("project/builds/{id}/logs")]
        public async Task<ActionResult> ProjectLogs(int id)
        {
            if (_org is null || _proj is null || _pat is null) return StatusCode(503);

            var file = await _svc.DownloadBuildLogsWithPatAsync(_org, _proj, id, _pat);
            return file is null
                ? NotFound()
                : File(file.Content, file.ContentType, file.FileName);
        }

        /* ───────────── helpers ───────────── */

        private Guid? UserId()
            => Guid.TryParse(User.FindFirstValue("id"), out var id) ? id : null;
    }
}
