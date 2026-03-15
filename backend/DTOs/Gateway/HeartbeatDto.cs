namespace FlowVision.API.DTOs.Gateway;

public class HeartbeatDto
{
    public string DeviceId { get; set; } = string.Empty;
    /// <summary>Optional display name sent by the gateway; updates Device.Name when present.</summary>
    public string? Name { get; set; }
    public string DeviceType { get; set; } = "gateway";
    public DateTime Timestamp { get; set; }
    public int LatencyMs { get; set; }
    public int MemoryUsagePercent { get; set; }
    public string FirmwareVersion { get; set; } = string.Empty;
    public int? ConnectedSensors { get; set; }
    public int? Uptime { get; set; }
    public int? WifiRssi { get; set; }
    public int? CpuFreqMhz { get; set; }
}
