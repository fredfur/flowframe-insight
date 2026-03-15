using FlowVision.API.Models.Enums;

namespace FlowVision.API.Models;

public class DeviceLog
{
    public long Id { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public DeviceType DeviceType { get; set; }
    public ConnectivityEventType EventType { get; set; }
    public int? LatencyMs { get; set; }
    public int? Fps { get; set; }
    public int? MemoryUsagePercent { get; set; }
    public string? FirmwareVersion { get; set; }
    public string? Detail { get; set; }
    public string? RawPayload { get; set; }
    public Guid? EquipmentId { get; set; }
    public Guid? LineId { get; set; }
    public DateTime Timestamp { get; set; }

    public Equipment? Equipment { get; set; }
    public ProductionLine? Line { get; set; }
}
