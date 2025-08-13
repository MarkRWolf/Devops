using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace Devops.Hubs
{
    public class WorkflowHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var scope = Context.GetHttpContext()?.Request?.Query["scope"].ToString();

            if (string.Equals(scope, "demo", StringComparison.OrdinalIgnoreCase))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "demo");
                await base.OnConnectedAsync();
                return;
            }

            var id =
                Context.User?.FindFirstValue(ClaimTypes.NameIdentifier) ??
                Context.User?.FindFirstValue("sub") ??
                Context.User?.FindFirstValue("id");

            if (Guid.TryParse(id, out var userId))
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var scope = Context.GetHttpContext()?.Request?.Query["scope"].ToString();

            if (string.Equals(scope, "demo", StringComparison.OrdinalIgnoreCase))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, "demo");
                await base.OnDisconnectedAsync(exception);
                return;
            }

            var id =
                Context.User?.FindFirstValue(ClaimTypes.NameIdentifier) ??
                Context.User?.FindFirstValue("sub") ??
                Context.User?.FindFirstValue("id");

            if (Guid.TryParse(id, out var userId))
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user-{userId}");

            await base.OnDisconnectedAsync(exception);
        }
    }
}
