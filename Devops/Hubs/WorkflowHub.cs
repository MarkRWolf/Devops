// Hubs/WorkflowHub.cs
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace Devops.Hubs
{
    /// <summary>
    /// Routes each connection into a per-user group (<c>user-{Guid}</c>)
    /// so broadcasts can be targeted to the correct account.
    /// </summary>
    public class WorkflowHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var userIdClaim = Context.User?.FindFirstValue("id");
            if (Guid.TryParse(userIdClaim, out var userId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userIdClaim = Context.User?.FindFirstValue("id");
            if (Guid.TryParse(userIdClaim, out var userId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user-{userId}");
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}
