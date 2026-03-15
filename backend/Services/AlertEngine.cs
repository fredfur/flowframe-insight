using FlowVision.API.Data;
using FlowVision.API.Models;
using FlowVision.API.Models.Enums;

namespace FlowVision.API.Services;

public class AlertEngine : IAlertEngine
{
    private readonly AppDbContext _db;

    public AlertEngine(AppDbContext db)
    {
        _db = db;
    }

    public async Task RaiseAsync(string source, string code, string message, ErrorSeverity severity, Guid? equipmentId = null, Guid? lineId = null, string? rawPayload = null)
    {
        var signal = new ErrorSignal
        {
            Source = source,
            Code = code,
            Message = message,
            Severity = severity,
            IsResolved = false,
            EquipmentId = equipmentId,
            LineId = lineId,
            RawPayload = rawPayload,
            Timestamp = DateTime.UtcNow
        };
        _db.ErrorSignals.Add(signal);
        await _db.SaveChangesAsync();
    }
}
