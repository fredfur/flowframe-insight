namespace FlowVision.API.DTOs.Realtime;

public class SpeedSampleDto
{
    public DateTime Timestamp { get; set; }
    public Guid EquipmentId { get; set; }
    public int Throughput { get; set; }
    public string Status { get; set; } = string.Empty;
}
