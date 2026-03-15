namespace FlowVision.API.Models;

/// <summary>
/// Physical unit (camera + microcontroller, e.g. ESP32-CAM) that measures
/// one equipment output and one equipment input. Performance is derived from this composition.
/// </summary>
public class Device
{
    public Guid Id { get; set; } = Guid.NewGuid();
    /// <summary>External ID used in heartbeat/telemetry (e.g. gateway id).</summary>
    public string ExternalId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Guid LineId { get; set; }
    /// <summary>Equipment whose output (pieces leaving) this device measures.</summary>
    public Guid? MeasuresOutputOfEquipmentId { get; set; }
    /// <summary>Equipment whose input (pieces entering) this device measures.</summary>
    public Guid? MeasuresInputOfEquipmentId { get; set; }
    public string? StreamUrl { get; set; }
    public DateTime? LastSeen { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ProductionLine Line { get; set; } = null!;
    public Equipment? MeasuresOutputOfEquipment { get; set; }
    public Equipment? MeasuresInputOfEquipment { get; set; }
}
