namespace FlowVision.API.Models;

public class ProductionFlow
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public Guid LineId { get; set; }
    public int NominalSpeed { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ProductionLine Line { get; set; } = null!;
    public ICollection<FlowEquipment> FlowEquipments { get; set; } = new List<FlowEquipment>();
    public ICollection<ProductionOrder> Orders { get; set; } = new List<ProductionOrder>();
}
