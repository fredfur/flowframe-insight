using FlowVision.API.Models.Enums;

namespace FlowVision.API.Models;

public class Stop
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EquipmentId { get; set; }
    public string MachineName { get; set; } = string.Empty;
    public Guid LineId { get; set; }
    public StopCategory Category { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public int? DurationMinutes { get; set; }
    public string? Notes { get; set; }
    public string RegisteredBy { get; set; } = string.Empty;
    public Guid? ProductionOrderId { get; set; }
    public Guid? ShiftId { get; set; }
    public bool IsAutoDetected { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Equipment Equipment { get; set; } = null!;
    public ProductionLine Line { get; set; } = null!;
    public ProductionOrder? ProductionOrder { get; set; }
    public Shift? Shift { get; set; }
}
