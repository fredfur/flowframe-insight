namespace FlowVision.API.DTOs;

public class ShiftDto
{
    public Guid Id { get; set; }
    public Guid SiteId { get; set; }
    public Guid? LineId { get; set; }
    public string Name { get; set; } = string.Empty;
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public bool CrossesMidnight { get; set; }
    public bool IsActive { get; set; }
}

public class CreateShiftDto
{
    public Guid SiteId { get; set; }
    public Guid? LineId { get; set; }
    public string Name { get; set; } = string.Empty;
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public bool CrossesMidnight { get; set; }
}

public class UpdateShiftDto
{
    public string? Name { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public bool? CrossesMidnight { get; set; }
    public bool? IsActive { get; set; }
}

public class ShiftOperatorsDto
{
    public List<Guid> UserIds { get; set; } = new();
}
