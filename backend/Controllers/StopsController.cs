using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowVision.API.Data;
using FlowVision.API.DTOs;
using FlowVision.API.Models;
using FlowVision.API.Models.Enums;

namespace FlowVision.API.Controllers;

[ApiController]
[Route("api/stops")]
[Authorize]
public class StopsController : ControllerBase
{
    private readonly AppDbContext _db;

    public StopsController(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>Lista paradas da linha. AllowAnonymous para Visão de Status na Linha ao vivo.</summary>
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    [HttpGet("~/api/lines/{lineId:guid}/stops")]
    public async Task<ActionResult<List<StopDto>>> GetByLine(Guid lineId)
    {
        var list = await _db.Stops
            .Where(s => s.LineId == lineId)
            .Select(s => new StopDto
            {
                Id = s.Id,
                EquipmentId = s.EquipmentId,
                MachineName = s.MachineName,
                LineId = s.LineId,
                Category = s.Category.ToString(),
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                DurationMinutes = s.DurationMinutes,
                Notes = s.Notes,
                RegisteredBy = s.RegisteredBy,
                ProductionOrderId = s.ProductionOrderId,
                IsAutoDetected = s.IsAutoDetected
            })
            .ToListAsync();
        return Ok(list);
    }

    /// <summary>Lista paradas do equipamento. AllowAnonymous para Visão de Status.</summary>
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    [HttpGet("~/api/machines/{machineId:guid}/stops")]
    public async Task<ActionResult<List<StopDto>>> GetByMachine(Guid machineId)
    {
        var list = await _db.Stops
            .Where(s => s.EquipmentId == machineId)
            .Select(s => new StopDto
            {
                Id = s.Id,
                EquipmentId = s.EquipmentId,
                MachineName = s.MachineName,
                LineId = s.LineId,
                Category = s.Category.ToString(),
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                DurationMinutes = s.DurationMinutes,
                Notes = s.Notes,
                RegisteredBy = s.RegisteredBy,
                ProductionOrderId = s.ProductionOrderId,
                IsAutoDetected = s.IsAutoDetected
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<StopDto>> GetById(Guid id)
    {
        var entity = await _db.Stops.FindAsync(id);
        if (entity == null) return NotFound();
        return Ok(new StopDto
        {
            Id = entity.Id,
            EquipmentId = entity.EquipmentId,
            MachineName = entity.MachineName,
            LineId = entity.LineId,
            Category = entity.Category.ToString(),
            StartTime = entity.StartTime,
            EndTime = entity.EndTime,
            DurationMinutes = entity.DurationMinutes,
            Notes = entity.Notes,
            RegisteredBy = entity.RegisteredBy,
            ProductionOrderId = entity.ProductionOrderId,
            IsAutoDetected = entity.IsAutoDetected
        });
    }

    [HttpPost]
    public async Task<ActionResult<StopDto>> Create([FromBody] CreateStopDto dto)
    {
        var equipment = await _db.Equipments.FindAsync(dto.EquipmentId);
        if (equipment == null) return BadRequest();
        if (!Enum.TryParse<StopCategory>(dto.Category, true, out var cat)) cat = StopCategory.Other;
        var entity = new Stop
        {
            Id = Guid.NewGuid(),
            EquipmentId = dto.EquipmentId,
            MachineName = equipment.Name,
            LineId = dto.LineId,
            Category = cat,
            StartTime = dto.StartTime,
            Notes = dto.Notes,
            RegisteredBy = User.Identity?.Name ?? "system",
            IsAutoDetected = false
        };
        _db.Stops.Add(entity);
        await _db.SaveChangesAsync();
        return Ok(new StopDto
        {
            Id = entity.Id,
            EquipmentId = entity.EquipmentId,
            MachineName = entity.MachineName,
            LineId = entity.LineId,
            Category = entity.Category.ToString(),
            StartTime = entity.StartTime,
            EndTime = entity.EndTime,
            DurationMinutes = entity.DurationMinutes,
            Notes = entity.Notes,
            RegisteredBy = entity.RegisteredBy,
            ProductionOrderId = entity.ProductionOrderId,
            IsAutoDetected = entity.IsAutoDetected
        });
    }

    [HttpPatch("{id:guid}/close")]
    public async Task<ActionResult<StopDto>> Close(Guid id, [FromBody] CloseStopDto dto)
    {
        var entity = await _db.Stops.FindAsync(id);
        if (entity == null) return NotFound();
        entity.EndTime = dto.EndTime;
        if (dto.Notes != null) entity.Notes = dto.Notes;
        entity.DurationMinutes = (int)(entity.EndTime!.Value - entity.StartTime).TotalMinutes;
        await _db.SaveChangesAsync();
        return Ok(new StopDto
        {
            Id = entity.Id,
            EquipmentId = entity.EquipmentId,
            MachineName = entity.MachineName,
            LineId = entity.LineId,
            Category = entity.Category.ToString(),
            StartTime = entity.StartTime,
            EndTime = entity.EndTime,
            DurationMinutes = entity.DurationMinutes,
            Notes = entity.Notes,
            RegisteredBy = entity.RegisteredBy,
            ProductionOrderId = entity.ProductionOrderId,
            IsAutoDetected = entity.IsAutoDetected
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var entity = await _db.Stops.FindAsync(id);
        if (entity == null) return NotFound();
        _db.Stops.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
