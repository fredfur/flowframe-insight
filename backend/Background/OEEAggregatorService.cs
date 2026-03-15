using FlowVision.API.Data;
using Microsoft.EntityFrameworkCore;

namespace FlowVision.API.Background;

public class OEEAggregatorService : BackgroundService
{
    private readonly IServiceProvider _sp;
    private readonly ILogger<OEEAggregatorService> _logger;

    public OEEAggregatorService(IServiceProvider sp, ILogger<OEEAggregatorService> logger)
    {
        _sp = sp;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                using var scope = _sp.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var lines = await db.ProductionLines.Where(l => l.IsActive).Select(l => l.Id).ToListAsync(ct);
                foreach (var lineId in lines)
                {
                    var eqIds = await db.Equipments.Where(e => e.LineId == lineId).Select(e => e.Id).ToListAsync(ct);
                    if (eqIds.Count > 0)
                        await db.MachineTelemetry
                            .Where(m => eqIds.Contains(m.EquipmentId))
                            .OrderByDescending(m => m.Timestamp)
                            .Take(20)
                            .AverageAsync(m => (double?)m.OEE, ct);
                }
            }
            catch (Exception ex) { _logger.LogWarning(ex, "OEEAggregator error"); }
            await Task.Delay(60_000, ct);
        }
    }
}
