namespace FlowVision.API.Models;

public class OperatorAssignment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid EquipmentId { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UnassignedAt { get; set; }

    public AppUser User { get; set; } = null!;
    public Equipment Equipment { get; set; } = null!;
}
