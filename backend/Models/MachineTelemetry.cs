using FlowVision.API.Models.Enums;

namespace FlowVision.API.Models;

public class MachineTelemetry
{
    public long Id { get; set; }
    public Guid EquipmentId { get; set; }
    public MachineStatus Status { get; set; }
    public int Throughput { get; set; }
    public decimal Availability { get; set; }
    public decimal Performance { get; set; }
    public decimal Quality { get; set; }
    public decimal OEE { get; set; }
    public string? RawPayload { get; set; }
    public DateTime Timestamp { get; set; }

    public Equipment Equipment { get; set; } = null!;
}
