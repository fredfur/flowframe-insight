namespace FlowVision.API.Models;

public class ProductionLine
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public Guid SiteId { get; set; }
    public int NominalSpeed { get; set; }
    public bool IsActive { get; set; } = true;
    public Guid? ActiveFlowId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Site Site { get; set; } = null!;
    public ProductionFlow? ActiveFlow { get; set; }
    public ICollection<Equipment> Equipments { get; set; } = new List<Equipment>();
    public ICollection<Transport> Transports { get; set; } = new List<Transport>();
    public ICollection<ProductionFlow> Flows { get; set; } = new List<ProductionFlow>();
    public ICollection<ProductionOrder> Orders { get; set; } = new List<ProductionOrder>();
    public ICollection<Shift> Shifts { get; set; } = new List<Shift>();
}
