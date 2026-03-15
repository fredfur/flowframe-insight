namespace FlowVision.API.Models;

public class FlowEquipment
{
    public Guid FlowId { get; set; }
    public Guid EquipmentId { get; set; }
    public int? OverrideNominalSpeed { get; set; }

    public ProductionFlow Flow { get; set; } = null!;
    public Equipment Equipment { get; set; } = null!;
}
