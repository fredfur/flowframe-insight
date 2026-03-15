using FlowVision.API.Models.Enums;

namespace FlowVision.API.Models;

public class TransportTelemetry
{
    public long Id { get; set; }
    public Guid TransportId { get; set; }
    public AccumulationLevel AccumulationLevel { get; set; }
    public int AccumulationPercent { get; set; }
    public int CurrentUnits { get; set; }
    public string? RawPayload { get; set; }
    public DateTime Timestamp { get; set; }

    public Transport Transport { get; set; } = null!;
}
