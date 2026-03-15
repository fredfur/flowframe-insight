namespace FlowVision.API.DTOs;

public class StopDto
{
    public Guid Id { get; set; }
    public Guid EquipmentId { get; set; }
    public string MachineName { get; set; } = string.Empty;
    public Guid LineId { get; set; }
    public string Category { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public int? DurationMinutes { get; set; }
    public string? Notes { get; set; }
    public string RegisteredBy { get; set; } = string.Empty;
    public Guid? ProductionOrderId { get; set; }
    public bool IsAutoDetected { get; set; }
}

public class CreateStopDto
{
    public Guid EquipmentId { get; set; }
    public Guid LineId { get; set; }
    public string Category { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public string? Notes { get; set; }
}

public class CloseStopDto
{
    public DateTime EndTime { get; set; }
    public string? Notes { get; set; }
}
