namespace FlowVision.API.DTOs;

public class ConnectivityStatusDto
{
    public List<GatewayStatusDto> Gateways { get; set; } = new();
    public List<CameraStatusItemDto> Cameras { get; set; } = new();
}

public class GatewayStatusDto
{
    public string DeviceId { get; set; } = string.Empty;
    public bool Connected { get; set; }
    public int? LatencyMs { get; set; }
    public DateTime? LastSeen { get; set; }
    public int? MemoryUsagePercent { get; set; }
    public string? FirmwareVersion { get; set; }
}

public class CameraStatusItemDto
{
    public string DeviceId { get; set; } = string.Empty;
    public bool Connected { get; set; }
    public int? Fps { get; set; }
    public DateTime? LastFrame { get; set; }
}

public class ConnTimelinePointDto
{
    public DateTime Timestamp { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public int? LatencyMs { get; set; }
    public bool Connected { get; set; }
}
