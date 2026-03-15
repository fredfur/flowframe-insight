namespace FlowVision.API.DTOs;

public class EquipmentDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public Guid LineId { get; set; }
    public int Position { get; set; }
    public int NominalSpeed { get; set; }
    public double X { get; set; }
    public double Y { get; set; }
    public string? GatewayDeviceId { get; set; }
    public string? CameraDeviceId { get; set; }
    public bool IsActive { get; set; }
    public bool IsBottleneck { get; set; }
}

public class CreateEquipmentDto
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public Guid LineId { get; set; }
    public int Position { get; set; }
    public int NominalSpeed { get; set; }
    public double X { get; set; }
    public double Y { get; set; }
}

public class UpdateEquipmentDto
{
    public string? Name { get; set; }
    public string? Type { get; set; }
    public int? Position { get; set; }
    public int? NominalSpeed { get; set; }
    public double? X { get; set; }
    public double? Y { get; set; }
    public bool? IsActive { get; set; }
    public bool? IsBottleneck { get; set; }
}

public class EquipmentPositionDto
{
    public double X { get; set; }
    public double Y { get; set; }
    public int Position { get; set; }
}

public class SetBottleneckDto
{
    public bool IsBottleneck { get; set; }
}
