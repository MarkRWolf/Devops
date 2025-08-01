// Hubs/WorkflowHub.cs
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace Devops.Hubs
{
    /// <summary>
    /// Places each authenticated connection into a personal group (<c>user-{Guid}</c>)
    /// for targeted webhook broadcasts.
    /// </summary>
    public class WorkflowHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var userIdClaim = Context.User?.FindFirstValue("id");
            if (Guid.TryParse(userIdClaim, out var userId))
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userIdClaim = Context.User?.FindFirstValue("id");
            if (Guid.TryParse(userIdClaim, out var userId))
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user-{userId}");

            await base.OnDisconnectedAsync(exception);
        }
    }
}
