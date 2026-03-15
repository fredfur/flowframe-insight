namespace FlowVision.API.DTOs;

public class FlowDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public Guid LineId { get; set; }
    public int NominalSpeed { get; set; }
    public bool IsActive { get; set; }
    public List<Guid> EquipmentIds { get; set; } = new();
}

public class CreateFlowDto
{
    public string Name { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public Guid LineId { get; set; }
    public List<Guid> EquipmentIds { get; set; } = new();
    public int NominalSpeed { get; set; }
}

public class UpdateFlowDto
{
    public string? Name { get; set; }
    public string? SKU { get; set; }
    public int? NominalSpeed { get; set; }
    public bool? IsActive { get; set; }
    public List<Guid>? EquipmentIds { get; set; }
}
