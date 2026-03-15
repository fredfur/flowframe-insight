using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowVision.API.Data;
using FlowVision.API.DTOs;
using FlowVision.API.Models;

namespace FlowVision.API.Controllers;

[ApiController]
[Route("api/shifts")]
[Authorize]
public class ShiftsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ShiftsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("~/api/sites/{siteId:guid}/shifts")]
    public async Task<ActionResult<List<ShiftDto>>> GetBySite(Guid siteId)
    {
        var list = await _db.Shifts
            .Where(s => s.SiteId == siteId)
            .Select(s => new ShiftDto
            {
                Id = s.Id,
                SiteId = s.SiteId,
                LineId = s.LineId,
                Name = s.Name,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                CrossesMidnight = s.CrossesMidnight,
                IsActive = s.IsActive
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ShiftDto>> GetById(Guid id)
    {
        var entity = await _db.Shifts.FindAsync(id);
        if (entity == null) return NotFound();
        return Ok(new ShiftDto
        {
            Id = entity.Id,
            SiteId = entity.SiteId,
            LineId = entity.LineId,
            Name = entity.Name,
            StartTime = entity.StartTime,
            EndTime = entity.EndTime,
            CrossesMidnight = entity.CrossesMidnight,
            IsActive = entity.IsActive
        });
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ShiftDto>> Create([FromBody] CreateShiftDto dto)
    {
        var entity = new Shift
        {
            Id = Guid.NewGuid(),
            SiteId = dto.SiteId,
            LineId = dto.LineId,
            Name = dto.Name,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            CrossesMidnight = dto.CrossesMidnight
        };
        _db.Shifts.Add(entity);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, new ShiftDto
        {
            Id = entity.Id,
            SiteId = entity.SiteId,
            LineId = entity.LineId,
            Name = entity.Name,
            StartTime = entity.StartTime,
            EndTime = entity.EndTime,
            CrossesMidnight = entity.CrossesMidnight,
            IsActive = entity.IsActive
        });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ShiftDto>> Update(Guid id, [FromBody] UpdateShiftDto dto)
    {
        var entity = await _db.Shifts.FindAsync(id);
        if (entity == null) return NotFound();
        if (dto.Name != null) entity.Name = dto.Name;
        if (dto.StartTime.HasValue) entity.StartTime = dto.StartTime.Value;
        if (dto.EndTime.HasValue) entity.EndTime = dto.EndTime.Value;
        if (dto.CrossesMidnight.HasValue) entity.CrossesMidnight = dto.CrossesMidnight.Value;
        if (dto.IsActive.HasValue) entity.IsActive = dto.IsActive.Value;
        await _db.SaveChangesAsync();
        return Ok(new ShiftDto
        {
            Id = entity.Id,
            SiteId = entity.SiteId,
            LineId = entity.LineId,
            Name = entity.Name,
            StartTime = entity.StartTime,
            EndTime = entity.EndTime,
            CrossesMidnight = entity.CrossesMidnight,
            IsActive = entity.IsActive
        });
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var entity = await _db.Shifts.FindAsync(id);
        if (entity == null) return NotFound();
        _db.Shifts.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:guid}/operators")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> SetOperators(Guid id, [FromBody] ShiftOperatorsDto dto)
    {
        var shift = await _db.Shifts.Include(s => s.ShiftOperators).FirstOrDefaultAsync(s => s.Id == id);
        if (shift == null) return NotFound();
        _db.ShiftOperators.RemoveRange(shift.ShiftOperators);
        foreach (var userId in dto.UserIds ?? new List<Guid>())
            _db.ShiftOperators.Add(new ShiftOperator { ShiftId = id, UserId = userId });
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
