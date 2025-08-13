// Hubs/WorkflowHub.cs
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace Devops.Hubs
{
    /// <summary>
    /// If connected with ?scope=demo → subscribes to my demo.
    /// Otherwise (no scope=demo) → joins the authenticated user's private group "user-{id}".
    /// Query params are ignored for user scoping; we only trust JWT claims.
    /// </summary>
    public class WorkflowHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var http  = Context.GetHttpContext();
            var scope = http?.Request?.Query["scope"].ToString();

            // DEMO feed
            if (string.Equals(scope, "demo", StringComparison.OrdinalIgnoreCase))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "demo");
            }
            else
            {
                // USER feed
                var userIdClaim = Context.User?.FindFirstValue("id");
                if (Guid.TryParse(userIdClaim, out var userId))
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
                }
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var http  = Context.GetHttpContext();
            var scope = http?.Request?.Query["scope"].ToString();

            if (string.Equals(scope, "demo", StringComparison.OrdinalIgnoreCase))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, "demo");
            }
            else
            {
                var userIdClaim = Context.User?.FindFirstValue("id");
                if (Guid.TryParse(userIdClaim, out var userId))
                {
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user-{userId}");
                }
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}
