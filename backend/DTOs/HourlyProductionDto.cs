namespace FlowVision.API.DTOs;

public class HourlyProductionDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Guid LineId { get; set; }
    public DateTime HourStart { get; set; }
    public int PlannedQuantity { get; set; }
    public int ActualQuantity { get; set; }
    public int RejectedQuantity { get; set; }
    public string? Operator { get; set; }
    public string? Notes { get; set; }
}

public class CreateHourlyProductionDto
{
    public DateTime HourStart { get; set; }
    public int PlannedQuantity { get; set; }
    public int ActualQuantity { get; set; }
    public int RejectedQuantity { get; set; }
    public string? Operator { get; set; }
    public string? Notes { get; set; }
}

public class UpdateHourlyProductionDto
{
    public int? PlannedQuantity { get; set; }
    public int? ActualQuantity { get; set; }
    public int? RejectedQuantity { get; set; }
    public string? Operator { get; set; }
    public string? Notes { get; set; }
}
