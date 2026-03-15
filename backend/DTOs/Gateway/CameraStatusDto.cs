namespace FlowVision.API.DTOs.Gateway;

public class CameraStatusDto
{
    public string DeviceId { get; set; } = string.Empty;
    public string DeviceType { get; set; } = "camera";
    public DateTime Timestamp { get; set; }
    public bool Connected { get; set; }
    public int Fps { get; set; }
    public string? Resolution { get; set; }
    public int LatencyMs { get; set; }
    public int BufferUsagePercent { get; set; }
    public bool? ModelLoaded { get; set; }
    public int? InferenceTimeMs { get; set; }
}
