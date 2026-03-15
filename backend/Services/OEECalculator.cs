using FlowVision.API.DTOs.Gateway;
using FlowVision.API.Models.Enums;

namespace FlowVision.API.Services;

public class OEECalculator : IOEECalculator
{
    public OeeResult Calculate(Guid equipmentId, TelemetryMeasurementsDto measurements, int nominalSpeed)
    {
        // Availability: 100 when Running, 0 otherwise (instantaneous; aggregation uses time windows)
        decimal availability = measurements.Status == (int)MachineStatus.Running ? 100 : 0;

        // Performance = (Throughput Real / Throughput Nominal) × 100, cap at 100
        decimal performance = nominalSpeed > 0
            ? Math.Min(100, (decimal)measurements.Throughput * 100 / nominalSpeed)
            : 0;

        // Quality = (Peças Boas / Total Produzido) × 100
        decimal quality = 100;
        if (measurements.Counters != null && measurements.Counters.TotalProduced > 0)
            quality = (decimal)measurements.Counters.GoodParts * 100 / measurements.Counters.TotalProduced;

        // OEE = (Availability × Performance × Quality) / 10000
        decimal oee = availability * performance * quality / 10000;

        return new OeeResult(availability, performance, quality, Math.Round(oee, 2));
    }
}
