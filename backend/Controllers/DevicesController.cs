using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowVision.API.Data;
using FlowVision.API.DTOs;
using FlowVision.API.Models;

namespace FlowVision.API.Controllers;

[ApiController]
[Route("api/devices")]
public class DevicesController : ControllerBase
{
    private readonly AppDbContext _db;

    public DevicesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<DeviceDto>>> GetAll()
    {
        var list = await _db.Devices
            .Select(d => new DeviceDto
            {
                Id = d.Id,
                ExternalId = d.ExternalId,
                Name = d.Name,
                LineId = d.LineId,
                MeasuresOutputOfEquipmentId = d.MeasuresOutputOfEquipmentId,
                MeasuresInputOfEquipmentId = d.MeasuresInputOfEquipmentId,
                StreamUrl = d.StreamUrl,
                LastSeen = d.LastSeen,
                IsActive = d.IsActive
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("~/api/lines/{lineId:guid}/devices")]
    public async Task<ActionResult<List<DeviceDto>>> GetByLine(Guid lineId)
    {
        var list = await _db.Devices
            .Where(d => d.LineId == lineId)
            .Select(d => new DeviceDto
            {
                Id = d.Id,
                ExternalId = d.ExternalId,
                Name = d.Name,
                LineId = d.LineId,
                MeasuresOutputOfEquipmentId = d.MeasuresOutputOfEquipmentId,
                MeasuresInputOfEquipmentId = d.MeasuresInputOfEquipmentId,
                StreamUrl = d.StreamUrl,
                LastSeen = d.LastSeen,
                IsActive = d.IsActive
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DeviceDto>> GetById(Guid id)
    {
        var entity = await _db.Devices.FindAsync(id);
        if (entity == null) return NotFound();
        return Ok(new DeviceDto
        {
            Id = entity.Id,
            ExternalId = entity.ExternalId,
            Name = entity.Name,
            LineId = entity.LineId,
            MeasuresOutputOfEquipmentId = entity.MeasuresOutputOfEquipmentId,
            MeasuresInputOfEquipmentId = entity.MeasuresInputOfEquipmentId,
            StreamUrl = entity.StreamUrl,
            LastSeen = entity.LastSeen,
            IsActive = entity.IsActive
        });
    }

    [HttpPost]
    public async Task<ActionResult<DeviceDto>> Create([FromBody] CreateDeviceDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.ExternalId))
            return BadRequest(new { message = "ExternalId is required." });
        var lineExists = await _db.ProductionLines.AnyAsync(l => l.Id == dto.LineId);
        if (!lineExists) return BadRequest(new { message = "Line not found." });
        if (dto.MeasuresOutputOfEquipmentId == null && dto.MeasuresInputOfEquipmentId == null)
            return BadRequest(new { message = "At least one of MeasuresOutputOfEquipmentId or MeasuresInputOfEquipmentId must be set." });

        var entity = new Device
        {
            Id = Guid.NewGuid(),
            ExternalId = dto.ExternalId.Trim(),
            Name = dto.Name?.Trim() ?? string.Empty,
            LineId = dto.LineId,
            MeasuresOutputOfEquipmentId = dto.MeasuresOutputOfEquipmentId,
            MeasuresInputOfEquipmentId = dto.MeasuresInputOfEquipmentId,
            StreamUrl = dto.StreamUrl?.Trim(),
            IsActive = true
        };
        _db.Devices.Add(entity);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, new DeviceDto
        {
            Id = entity.Id,
            ExternalId = entity.ExternalId,
            Name = entity.Name,
            LineId = entity.LineId,
            MeasuresOutputOfEquipmentId = entity.MeasuresOutputOfEquipmentId,
            MeasuresInputOfEquipmentId = entity.MeasuresInputOfEquipmentId,
            StreamUrl = entity.StreamUrl,
            LastSeen = entity.LastSeen,
            IsActive = entity.IsActive
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<DeviceDto>> Update(Guid id, [FromBody] UpdateDeviceDto dto)
    {
        var entity = await _db.Devices.FindAsync(id);
        if (entity == null) return NotFound();
        if (dto.Name != null) entity.Name = dto.Name.Trim();
        if (dto.MeasuresOutputOfEquipmentId.HasValue || dto.MeasuresInputOfEquipmentId.HasValue)
        {
            if (dto.MeasuresOutputOfEquipmentId.HasValue) entity.MeasuresOutputOfEquipmentId = dto.MeasuresOutputOfEquipmentId.Value == Guid.Empty ? null : dto.MeasuresOutputOfEquipmentId;
            if (dto.MeasuresInputOfEquipmentId.HasValue) entity.MeasuresInputOfEquipmentId = dto.MeasuresInputOfEquipmentId.Value == Guid.Empty ? null : dto.MeasuresInputOfEquipmentId;
            if (entity.MeasuresOutputOfEquipmentId == null && entity.MeasuresInputOfEquipmentId == null)
                return BadRequest(new { message = "At least one of MeasuresOutputOfEquipmentId or MeasuresInputOfEquipmentId must remain set." });
        }
        if (dto.StreamUrl != null) entity.StreamUrl = string.IsNullOrWhiteSpace(dto.StreamUrl) ? null : dto.StreamUrl.Trim();
        if (dto.IsActive.HasValue) entity.IsActive = dto.IsActive.Value;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new DeviceDto
        {
            Id = entity.Id,
            ExternalId = entity.ExternalId,
            Name = entity.Name,
            LineId = entity.LineId,
            MeasuresOutputOfEquipmentId = entity.MeasuresOutputOfEquipmentId,
            MeasuresInputOfEquipmentId = entity.MeasuresInputOfEquipmentId,
            StreamUrl = entity.StreamUrl,
            LastSeen = entity.LastSeen,
            IsActive = entity.IsActive
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var entity = await _db.Devices.FindAsync(id);
        if (entity == null) return NotFound();
        _db.Devices.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
