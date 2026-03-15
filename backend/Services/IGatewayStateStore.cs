namespace FlowVision.API.Services;

public interface IGatewayStateStore
{
    void UpdateHeartbeat(string deviceId, string deviceType, int latencyMs, int? memoryPercent, string? firmware, DateTime timestamp);
    (bool connected, int? latency, DateTime? lastSeen) GetGatewayStatus(string deviceId);
    IReadOnlyList<(string DeviceId, string DeviceType, DateTime LastSeen)> GetAllLastSeen();
}
