namespace FlowVision.API.DTOs;

public class DeviceDto
{
    public Guid Id { get; set; }
    public string ExternalId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Guid LineId { get; set; }
    public Guid? MeasuresOutputOfEquipmentId { get; set; }
    public Guid? MeasuresInputOfEquipmentId { get; set; }
    public string? StreamUrl { get; set; }
    public DateTime? LastSeen { get; set; }
    public bool IsActive { get; set; }
}

public class CreateDeviceDto
{
    public string ExternalId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Guid LineId { get; set; }
    public Guid? MeasuresOutputOfEquipmentId { get; set; }
    public Guid? MeasuresInputOfEquipmentId { get; set; }
    public string? StreamUrl { get; set; }
}

public class UpdateDeviceDto
{
    public string? Name { get; set; }
    public Guid? MeasuresOutputOfEquipmentId { get; set; }
    public Guid? MeasuresInputOfEquipmentId { get; set; }
    public string? StreamUrl { get; set; }
    public bool? IsActive { get; set; }
}
