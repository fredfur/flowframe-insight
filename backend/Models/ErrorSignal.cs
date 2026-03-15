using FlowVision.API.Models.Enums;

namespace FlowVision.API.Models;

public class ErrorSignal
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Source { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public ErrorSeverity Severity { get; set; }
    public bool IsResolved { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? ResolvedBy { get; set; }
    public string? ResolutionNotes { get; set; }
    public Guid? EquipmentId { get; set; }
    public Guid? LineId { get; set; }
    public string? RawPayload { get; set; }
    public DateTime Timestamp { get; set; }

    public Equipment? Equipment { get; set; }
    public ProductionLine? Line { get; set; }
}
