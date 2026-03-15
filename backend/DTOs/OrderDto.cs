namespace FlowVision.API.DTOs;

public class OrderDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid FlowId { get; set; }
    public Guid LineId { get; set; }
    public int TargetQuantity { get; set; }
    public int ProducedQuantity { get; set; }
    public int RejectedQuantity { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime PlannedStart { get; set; }
    public DateTime? PlannedEnd { get; set; }
    public DateTime? ActualStart { get; set; }
    public DateTime? ActualEnd { get; set; }
    public string? Notes { get; set; }
}

public class CreateOrderDto
{
    public string OrderNumber { get; set; } = string.Empty;
    public Guid FlowId { get; set; }
    public Guid LineId { get; set; }
    public int TargetQuantity { get; set; }
    public DateTime PlannedStart { get; set; }
    public DateTime? PlannedEnd { get; set; }
    public string? Notes { get; set; }
}

public class UpdateOrderDto
{
    public int? TargetQuantity { get; set; }
    public DateTime? PlannedStart { get; set; }
    public DateTime? PlannedEnd { get; set; }
    public string? Notes { get; set; }
}

public class CancelOrderDto
{
    public string? Reason { get; set; }
}
