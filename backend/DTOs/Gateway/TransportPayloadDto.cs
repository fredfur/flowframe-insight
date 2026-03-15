namespace FlowVision.API.DTOs.Gateway;

public class TransportPayloadDto
{
    public string DeviceId { get; set; } = string.Empty;
    public string? TransportId { get; set; }
    public DateTime Timestamp { get; set; }
    public int AccumulationPercent { get; set; }
    public int CurrentUnits { get; set; }
    public string? SensorType { get; set; }
}
