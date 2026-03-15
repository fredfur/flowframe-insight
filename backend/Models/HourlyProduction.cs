namespace FlowVision.API.Models;

public class HourlyProduction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Guid LineId { get; set; }
    public DateTime HourStart { get; set; }
    public int PlannedQuantity { get; set; }
    public int ActualQuantity { get; set; }
    public int RejectedQuantity { get; set; }
    public string? Operator { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ProductionOrder Order { get; set; } = null!;
    public ProductionLine Line { get; set; } = null!;
}
