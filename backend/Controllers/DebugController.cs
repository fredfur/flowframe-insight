using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowVision.API.Data;
using FlowVision.API.Models;

namespace FlowVision.API.Controllers;

[ApiController]
[Route("api/debug")]
[Authorize(Roles = "Admin")]
public class DebugController : ControllerBase
{
    private readonly AppDbContext _db;

    public DebugController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("logs")]
    public async Task<ActionResult> GetLogs([FromQuery] int limit = 100)
    {
        var list = await _db.SystemLogs
            .OrderByDescending(l => l.Timestamp)
            .Take(limit)
            .Select(l => new { l.Id, l.Level, l.Source, l.Message, l.Timestamp })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("errors")]
    public async Task<ActionResult> GetErrors([FromQuery] bool? resolved = null)
    {
        var query = _db.ErrorSignals.AsQueryable();
        if (resolved.HasValue) query = query.Where(e => e.IsResolved == resolved.Value);
        var list = await query
            .OrderByDescending(e => e.Timestamp)
            .Select(e => new { e.Id, e.Source, e.Code, e.Message, e.Severity, e.IsResolved, e.Timestamp })
            .ToListAsync();
        return Ok(list);
    }

    [HttpPatch("errors/{id:guid}/resolve")]
    public async Task<IActionResult> ResolveError(Guid id, [FromQuery] string? notes = null)
    {
        var entity = await _db.ErrorSignals.FindAsync(id);
        if (entity == null) return NotFound();
        entity.IsResolved = true;
        entity.ResolvedAt = DateTime.UtcNow;
        entity.ResolvedBy = User.Identity?.Name;
        entity.ResolutionNotes = notes;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
