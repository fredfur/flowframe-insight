using System.Collections.Concurrent;

namespace FlowVision.API.Services;

public class GatewayStateStore : IGatewayStateStore
{
    private readonly ConcurrentDictionary<string, GatewayState> _state = new();

    public void UpdateHeartbeat(string deviceId, string deviceType, int latencyMs, int? memoryPercent, string? firmware, DateTime timestamp)
    {
        _state.AddOrUpdate(deviceId, _ => new GatewayState(deviceType, latencyMs, memoryPercent, firmware, timestamp),
            (_, s) => s with { LatencyMs = latencyMs, MemoryPercent = memoryPercent, Firmware = firmware, LastSeen = timestamp });
    }

    public (bool connected, int? latency, DateTime? lastSeen) GetGatewayStatus(string deviceId)
    {
        if (!_state.TryGetValue(deviceId, out var s))
            return (false, null, null);
        return (true, s.LatencyMs, s.LastSeen);
    }

    public IReadOnlyList<(string DeviceId, string DeviceType, DateTime LastSeen)> GetAllLastSeen()
    {
        return _state.Select(kv => (kv.Key, kv.Value.DeviceType, kv.Value.LastSeen)).ToList();
    }

    private record GatewayState(string DeviceType, int LatencyMs, int? MemoryPercent, string? Firmware, DateTime LastSeen);
}
