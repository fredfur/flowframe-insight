using FlowVision.API.Data;
using Microsoft.EntityFrameworkCore;

namespace FlowVision.API.Services;

public class ShiftManager : IShiftManager
{
    private readonly AppDbContext _db;

    public ShiftManager(AppDbContext db) => _db = db;

    public async Task<Guid?> GetCurrentShiftIdAsync(Guid siteId, Guid? lineId = null)
    {
        var now = DateTime.UtcNow.TimeOfDay;
        var shifts = await _db.Shifts
            .Where(s => s.SiteId == siteId && s.IsActive && (s.LineId == null || s.LineId == lineId))
            .ToListAsync();
        foreach (var shift in shifts)
        {
            var start = shift.StartTime.ToTimeSpan();
            var end = shift.EndTime.ToTimeSpan();
            bool inShift = shift.CrossesMidnight ? (now >= start || now < end) : (now >= start && now < end);
            if (inShift) return shift.Id;
        }
        return null;
    }
}
