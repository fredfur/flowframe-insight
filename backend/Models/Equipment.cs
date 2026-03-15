using FlowVision.API.Models.Enums;

namespace FlowVision.API.Models;

public class Equipment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public Guid LineId { get; set; }
    public int Position { get; set; }
    public int NominalSpeed { get; set; }
    public double X { get; set; }
    public double Y { get; set; }
    public string? GatewayDeviceId { get; set; }
    public string? CameraDeviceId { get; set; }
    public bool IsActive { get; set; } = true;
    /// <summary>When true, this equipment (or cluster) defines the line efficiency; line OEE = bottleneck OEE.</summary>
    public bool IsBottleneck { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ProductionLine Line { get; set; } = null!;
    public ICollection<Stop> Stops { get; set; } = new List<Stop>();
    public ICollection<MachineTelemetry> TelemetryHistory { get; set; } = new List<MachineTelemetry>();
    public ICollection<FlowEquipment> FlowEquipments { get; set; } = new List<FlowEquipment>();
    public ICollection<OperatorAssignment> OperatorAssignments { get; set; } = new List<OperatorAssignment>();
}
