namespace FlowVision.API.DTOs.Realtime;

public class DLIDataPointDto
{
    public DateTime Timestamp { get; set; }
    public int Throughput { get; set; }
    public int CumulativeProduced { get; set; }
    public int TargetQuantity { get; set; }
    public double DliPercent { get; set; }
}
