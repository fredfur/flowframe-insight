using FlowVision.API.Models.Enums;

namespace FlowVision.API.Models;

public class SystemLog
{
    public long Id { get; set; }
    public SystemLogLevel Level { get; set; }
    public string Source { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? StackTrace { get; set; }
    public string? Metadata { get; set; }
    public DateTime Timestamp { get; set; }
}
