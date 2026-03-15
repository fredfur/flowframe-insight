using FlowVision.API.Models.Enums;

namespace FlowVision.API.Models;

public class Transport
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LineId { get; set; }
    public int FromPosition { get; set; }
    public int ToPosition { get; set; }
    public TransportType Type { get; set; } = TransportType.Conveyor;
    public int Capacity { get; set; }
    public string? SensorDeviceId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ProductionLine Line { get; set; } = null!;
    public ICollection<TransportTelemetry> TelemetryHistory { get; set; } = new List<TransportTelemetry>();
}
