namespace FlowVision.API.DTOs;

public class LineDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public Guid SiteId { get; set; }
    public int NominalSpeed { get; set; }
    public bool IsActive { get; set; }
    public Guid? ActiveFlowId { get; set; }
}

public class CreateLineDto
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public Guid SiteId { get; set; }
    public int NominalSpeed { get; set; }
}

public class UpdateLineDto
{
    public string? Name { get; set; }
    public string? Type { get; set; }
    public int? NominalSpeed { get; set; }
    public bool? IsActive { get; set; }
}

public class ActivateFlowDto
{
    public Guid FlowId { get; set; }
}
