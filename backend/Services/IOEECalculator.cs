using FlowVision.API.DTOs.Gateway;

namespace FlowVision.API.Services;

public interface IOEECalculator
{
    /// <summary>
    /// Calculates OEE for a single telemetry sample.
    /// Nominal speed comes from the active flow on the line.
    /// </summary>
    OeeResult Calculate(Guid equipmentId, TelemetryMeasurementsDto measurements, int nominalSpeed);
}
