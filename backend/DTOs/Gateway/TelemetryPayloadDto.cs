namespace FlowVision.API.DTOs.Gateway;

public class TelemetryPayloadDto
{
    public string DeviceId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string? EquipmentId { get; set; }
    public TelemetryMeasurementsDto Measurements { get; set; } = null!;
    public TelemetryMetaDto? Meta { get; set; }
}

public class TelemetryMeasurementsDto
{
    public int Status { get; set; }
    public int Throughput { get; set; }
    public TelemetryCountersDto? Counters { get; set; }
    public TelemetrySensorsDto? Sensors { get; set; }
}

public class TelemetryCountersDto
{
    public int TotalProduced { get; set; }
    public int GoodParts { get; set; }
    public int RejectedParts { get; set; }
}

public class TelemetrySensorsDto
{
    public double? Temperature { get; set; }
    public double? Vibration { get; set; }
    public double? Current { get; set; }
    public double? Pressure { get; set; }
    public double? Humidity { get; set; }
}

public class TelemetryMetaDto
{
    public string? FirmwareVersion { get; set; }
    public int? Uptime { get; set; }
    public int? FreeHeap { get; set; }
    public int? WifiRssi { get; set; }
    public double? BatteryVoltage { get; set; }
}
