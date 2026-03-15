using FlowVision.API.Data;
using FlowVision.API.DTOs.Realtime;
using Microsoft.EntityFrameworkCore;

namespace FlowVision.API.Services;

public class StopAnalyzer : IStopAnalyzer
{
    private readonly AppDbContext _db;

    public StopAnalyzer(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<ParetoDataPointDto>> GetParetoAsync(Guid lineId, DateTime from, DateTime to)
    {
        var stops = await _db.Stops
            .Where(s => s.LineId == lineId && s.StartTime >= from && s.EndTime != null && s.EndTime <= to)
            .GroupBy(s => s.Category)
            .Select(g => new { Category = g.Key.ToString(), Count = g.Count(), TotalMinutes = g.Sum(s => s.DurationMinutes ?? 0) })
            .ToListAsync();

        var totalMinutes = stops.Sum(x => x.TotalMinutes);
        var configs = await _db.StopCategoryConfigs
            .Where(c => c.IsActive)
            .ToDictionaryAsync(c => c.Category.ToString(), c => c.Label);

        return stops
            .OrderByDescending(x => x.TotalMinutes)
            .Select(x => new ParetoDataPointDto
            {
                Category = x.Category,
                Label = configs.GetValueOrDefault(x.Category),
                Count = x.Count,
                TotalDurationMinutes = x.TotalMinutes,
                PercentOfTotal = totalMinutes > 0 ? (double)x.TotalMinutes * 100 / totalMinutes : 0
            })
            .ToList();
    }
}
