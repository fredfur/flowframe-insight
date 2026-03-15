using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowVision.API.Data;
using FlowVision.API.DTOs;
using FlowVision.API.Models;

namespace FlowVision.API.Controllers;

[ApiController]
[Route("api/flows")]
public class FlowsController : ControllerBase
{
    private readonly AppDbContext _db;

    public FlowsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<ActionResult<List<FlowDto>>> GetAll()
    {
        var list = await _db.ProductionFlows
            .Include(f => f.FlowEquipments)
            .Select(f => new FlowDto
            {
                Id = f.Id,
                Name = f.Name,
                SKU = f.SKU,
                LineId = f.LineId,
                NominalSpeed = f.NominalSpeed,
                IsActive = f.IsActive,
                EquipmentIds = f.FlowEquipments.Select(fe => fe.EquipmentId).ToList()
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("~/api/lines/{lineId:guid}/flows")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<ActionResult<List<FlowDto>>> GetByLine(Guid lineId)
    {
        var list = await _db.ProductionFlows
            .Where(f => f.LineId == lineId)
            .Include(f => f.FlowEquipments)
            .Select(f => new FlowDto
            {
                Id = f.Id,
                Name = f.Name,
                SKU = f.SKU,
                LineId = f.LineId,
                NominalSpeed = f.NominalSpeed,
                IsActive = f.IsActive,
                EquipmentIds = f.FlowEquipments.Select(fe => fe.EquipmentId).ToList()
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<ActionResult<FlowDto>> GetById(Guid id)
    {
        var entity = await _db.ProductionFlows
            .Include(f => f.FlowEquipments)
            .FirstOrDefaultAsync(f => f.Id == id);
        if (entity == null) return NotFound();
        return Ok(new FlowDto
        {
            Id = entity.Id,
            Name = entity.Name,
            SKU = entity.SKU,
            LineId = entity.LineId,
            NominalSpeed = entity.NominalSpeed,
            IsActive = entity.IsActive,
            EquipmentIds = entity.FlowEquipments.Select(fe => fe.EquipmentId).ToList()
        });
    }

    [HttpPost]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<ActionResult<FlowDto>> Create([FromBody] CreateFlowDto dto)
    {
        var entity = new ProductionFlow
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            SKU = dto.SKU,
            LineId = dto.LineId,
            NominalSpeed = dto.NominalSpeed
        };
        _db.ProductionFlows.Add(entity);
        foreach (var eqId in dto.EquipmentIds ?? new List<Guid>())
            _db.FlowEquipments.Add(new FlowEquipment { FlowId = entity.Id, EquipmentId = eqId });
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, new FlowDto
        {
            Id = entity.Id,
            Name = entity.Name,
            SKU = entity.SKU,
            LineId = entity.LineId,
            NominalSpeed = entity.NominalSpeed,
            IsActive = entity.IsActive,
            EquipmentIds = dto.EquipmentIds ?? new List<Guid>()
        });
    }

    [HttpPut("{id:guid}")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<ActionResult<FlowDto>> Update(Guid id, [FromBody] UpdateFlowDto dto)
    {
        var entity = await _db.ProductionFlows.Include(f => f.FlowEquipments).FirstOrDefaultAsync(f => f.Id == id);
        if (entity == null) return NotFound();
        if (dto.Name != null) entity.Name = dto.Name;
        if (dto.SKU != null) entity.SKU = dto.SKU;
        if (dto.NominalSpeed.HasValue) entity.NominalSpeed = dto.NominalSpeed.Value;
        if (dto.IsActive.HasValue) entity.IsActive = dto.IsActive.Value;
        if (dto.EquipmentIds != null)
        {
            _db.FlowEquipments.RemoveRange(entity.FlowEquipments);
            foreach (var eqId in dto.EquipmentIds)
                _db.FlowEquipments.Add(new FlowEquipment { FlowId = entity.Id, EquipmentId = eqId });
        }
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new FlowDto
        {
            Id = entity.Id,
            Name = entity.Name,
            SKU = entity.SKU,
            LineId = entity.LineId,
            NominalSpeed = entity.NominalSpeed,
            IsActive = entity.IsActive,
            EquipmentIds = entity.FlowEquipments.Select(fe => fe.EquipmentId).ToList()
        });
    }

    [HttpDelete("{id:guid}")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<IActionResult> Delete(Guid id)
    {
        var entity = await _db.ProductionFlows.FindAsync(id);
        if (entity == null) return NotFound();
        _db.ProductionFlows.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
