using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowVision.API.Data;
using FlowVision.API.DTOs;
using FlowVision.API.Models;

namespace FlowVision.API.Controllers;

[ApiController]
[Route("api/transports")]
[Authorize]
public class TransportsController : ControllerBase
{
    private readonly AppDbContext _db;

    public TransportsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("~/api/lines/{lineId:guid}/transports")]
    public async Task<ActionResult<List<TransportDto>>> GetByLine(Guid lineId)
    {
        var list = await _db.Transports
            .Where(t => t.LineId == lineId)
            .Select(t => new TransportDto
            {
                Id = t.Id,
                LineId = t.LineId,
                FromPosition = t.FromPosition,
                ToPosition = t.ToPosition,
                Type = t.Type.ToString(),
                Capacity = t.Capacity,
                SensorDeviceId = t.SensorDeviceId
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TransportDto>> GetById(Guid id)
    {
        var entity = await _db.Transports.FindAsync(id);
        if (entity == null) return NotFound();
        return Ok(new TransportDto
        {
            Id = entity.Id,
            LineId = entity.LineId,
            FromPosition = entity.FromPosition,
            ToPosition = entity.ToPosition,
            Type = entity.Type.ToString(),
            Capacity = entity.Capacity,
            SensorDeviceId = entity.SensorDeviceId
        });
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<TransportDto>> Create([FromBody] CreateTransportDto dto)
    {
        var entity = new Transport
        {
            Id = Guid.NewGuid(),
            LineId = dto.LineId,
            FromPosition = dto.FromPosition,
            ToPosition = dto.ToPosition,
            Type = dto.Type,
            Capacity = dto.Capacity,
            SensorDeviceId = dto.SensorDeviceId
        };
        _db.Transports.Add(entity);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, new TransportDto
        {
            Id = entity.Id,
            LineId = entity.LineId,
            FromPosition = entity.FromPosition,
            ToPosition = entity.ToPosition,
            Type = entity.Type.ToString(),
            Capacity = entity.Capacity,
            SensorDeviceId = entity.SensorDeviceId
        });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<TransportDto>> Update(Guid id, [FromBody] UpdateTransportDto dto)
    {
        var entity = await _db.Transports.FindAsync(id);
        if (entity == null) return NotFound();
        if (dto.FromPosition.HasValue) entity.FromPosition = dto.FromPosition.Value;
        if (dto.ToPosition.HasValue) entity.ToPosition = dto.ToPosition.Value;
        if (dto.Type.HasValue) entity.Type = dto.Type.Value;
        if (dto.Capacity.HasValue) entity.Capacity = dto.Capacity.Value;
        if (dto.SensorDeviceId != null) entity.SensorDeviceId = dto.SensorDeviceId;
        await _db.SaveChangesAsync();
        return Ok(new TransportDto
        {
            Id = entity.Id,
            LineId = entity.LineId,
            FromPosition = entity.FromPosition,
            ToPosition = entity.ToPosition,
            Type = entity.Type.ToString(),
            Capacity = entity.Capacity,
            SensorDeviceId = entity.SensorDeviceId
        });
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var entity = await _db.Transports.FindAsync(id);
        if (entity == null) return NotFound();
        _db.Transports.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
