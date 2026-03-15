namespace FlowVision.API.Models;

public class ShiftOperator
{
    public Guid ShiftId { get; set; }
    public Guid UserId { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    public Shift Shift { get; set; } = null!;
    public AppUser User { get; set; } = null!;
}
