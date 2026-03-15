using FlowVision.API.Data;
using FlowVision.API.Hubs;
using FlowVision.API.Models;
using FlowVision.API.Models.Enums;
using Microsoft.AspNetCore.SignalR;

namespace FlowVision.API.Background;

public class HeartbeatMonitorService : BackgroundService
{
    private readonly IServiceProvider _sp;
    private readonly IConfiguration _config;
    private readonly ILogger<HeartbeatMonitorService> _logger;

    public HeartbeatMonitorService(IServiceProvider sp, IConfiguration config, ILogger<HeartbeatMonitorService> logger)
    {
        _sp = sp;
        _config = config;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        var timeoutSec = int.TryParse(_config["Gateway:HeartbeatTimeoutSeconds"], out var t) ? t : 30;
        while (!ct.IsCancellationRequested)
        {
            try
            {
                using var scope = _sp.CreateScope();
                var store = scope.ServiceProvider.GetRequiredService<Services.IGatewayStateStore>();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var hub = scope.ServiceProvider.GetRequiredService<IHubContext<ProductionHub>>();
                var cutoff = DateTime.UtcNow.AddSeconds(-timeoutSec);
                foreach (var (deviceId, deviceType, lastSeen) in store.GetAllLastSeen())
                {
                    if (lastSeen < cutoff)
                    {
                        db.DeviceLogs.Add(new DeviceLog
                        {
                            DeviceId = deviceId,
                            DeviceType = deviceType == "camera" ? DeviceType.Camera : DeviceType.Gateway,
                            EventType = ConnectivityEventType.Disconnected,
                            Detail = $"No heartbeat for {timeoutSec}s",
                            Timestamp = DateTime.UtcNow
                        });
                        var eventName = deviceType == "camera" ? "CameraStatusChanged" : "GatewayStatusChanged";
                        await hub.Clients.All.SendAsync(eventName, new { deviceId, connected = false, lastSeen }, ct);
                    }
                }
                await db.SaveChangesAsync(ct);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "HeartbeatMonitor error"); }
            await Task.Delay(10_000, ct);
        }
    }
}
