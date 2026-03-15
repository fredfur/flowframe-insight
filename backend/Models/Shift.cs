namespace FlowVision.API.Models;

public class Shift
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SiteId { get; set; }
    public Guid? LineId { get; set; }
    public string Name { get; set; } = string.Empty;
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public bool CrossesMidnight { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Site Site { get; set; } = null!;
    public ProductionLine? Line { get; set; }
    public ICollection<ShiftOperator> ShiftOperators { get; set; } = new List<ShiftOperator>();
}
