namespace FlowVision.API.DTOs.Realtime;

public class ParetoDataPointDto
{
    public string Category { get; set; } = string.Empty;
    public string? Label { get; set; }
    public int Count { get; set; }
    public int TotalDurationMinutes { get; set; }
    public double PercentOfTotal { get; set; }
}
