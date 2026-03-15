namespace FlowVision.API.DTOs.Realtime;

public class OEEHistoryPointDto
{
    public DateTime Timestamp { get; set; }
    public decimal Oee { get; set; }
    public decimal Availability { get; set; }
    public decimal Performance { get; set; }
    public decimal Quality { get; set; }
}
