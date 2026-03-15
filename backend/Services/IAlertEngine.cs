using FlowVision.API.Models.Enums;

namespace FlowVision.API.Services;

public interface IAlertEngine
{
    Task RaiseAsync(string source, string code, string message, ErrorSeverity severity, Guid? equipmentId = null, Guid? lineId = null, string? rawPayload = null);
}
