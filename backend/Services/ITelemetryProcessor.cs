using FlowVision.API.DTOs.Gateway;

namespace FlowVision.API.Services;

public interface ITelemetryProcessor
{
    Task ProcessAsync(TelemetryPayloadDto payload);
}
