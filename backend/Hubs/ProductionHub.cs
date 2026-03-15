using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace FlowVision.API.Hubs;

[Authorize]
public class ProductionHub : Hub
{
    public Task JoinLineGroup(string lineId) => Groups.AddToGroupAsync(Context.ConnectionId, $"line-{lineId}");
    public Task LeaveLineGroup(string lineId) => Groups.RemoveFromGroupAsync(Context.ConnectionId, $"line-{lineId}");
    public Task JoinDebugGroup() => Groups.AddToGroupAsync(Context.ConnectionId, "debug");
    public Task LeaveDebugGroup() => Groups.RemoveFromGroupAsync(Context.ConnectionId, "debug");
}
