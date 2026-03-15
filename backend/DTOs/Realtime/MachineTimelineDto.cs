namespace FlowVision.API.DTOs.Realtime;

public class MachineTimelineDto
{
    public Guid EquipmentId { get; set; }
    public string EquipmentName { get; set; } = string.Empty;
    public List<TimelineSegmentDto> Segments { get; set; } = new();
}

public class TimelineSegmentDto
{
    public string Status { get; set; } = string.Empty;
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
    public int DurationMinutes { get; set; }
    public string? StopCategory { get; set; }
}
