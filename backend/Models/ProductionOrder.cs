using FlowVision.API.Models.Enums;

namespace FlowVision.API.Models;

public class ProductionOrder
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string OrderNumber { get; set; } = string.Empty;
    public Guid FlowId { get; set; }
    public Guid LineId { get; set; }
    public int TargetQuantity { get; set; }
    public int ProducedQuantity { get; set; }
    public int RejectedQuantity { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Planned;
    public DateTime PlannedStart { get; set; }
    public DateTime? PlannedEnd { get; set; }
    public DateTime? ActualStart { get; set; }
    public DateTime? ActualEnd { get; set; }
    public string? Notes { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ProductionFlow Flow { get; set; } = null!;
    public ProductionLine Line { get; set; } = null!;
    public ICollection<HourlyProduction> HourlyRecords { get; set; } = new List<HourlyProduction>();
}
