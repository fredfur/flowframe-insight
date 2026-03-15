namespace FlowVision.API.DTOs.Gateway;

public class ErrorReportDto
{
    public string DeviceId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Severity { get; set; } = "medium";
    public Dictionary<string, object>? Metadata { get; set; }
}
