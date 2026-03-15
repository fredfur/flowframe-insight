using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowVision.API.Data;
using FlowVision.API.DTOs;
using FlowVision.API.Models;

namespace FlowVision.API.Controllers;

[ApiController]
[Route("api/equipments")]
[Microsoft.AspNetCore.Authorization.AllowAnonymous]
public class EquipmentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public EquipmentsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<EquipmentDto>>> GetAll()
    {
        var list = await _db.Equipments
            .Select(e => new EquipmentDto
            {
                Id = e.Id,
                Name = e.Name,
                Type = e.Type,
                LineId = e.LineId,
                Position = e.Position,
                NominalSpeed = e.NominalSpeed,
                X = e.X,
                Y = e.Y,
                GatewayDeviceId = e.GatewayDeviceId,
                CameraDeviceId = e.CameraDeviceId,
                IsActive = e.IsActive,
                IsBottleneck = e.IsBottleneck
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("~/api/lines/{lineId:guid}/equipments")]
    public async Task<ActionResult<List<EquipmentDto>>> GetByLine(Guid lineId)
    {
        var list = await _db.Equipments
            .Where(e => e.LineId == lineId)
            .Select(e => new EquipmentDto
            {
                Id = e.Id,
                Name = e.Name,
                Type = e.Type,
                LineId = e.LineId,
                Position = e.Position,
                NominalSpeed = e.NominalSpeed,
                X = e.X,
                Y = e.Y,
                GatewayDeviceId = e.GatewayDeviceId,
                CameraDeviceId = e.CameraDeviceId,
                IsActive = e.IsActive,
                IsBottleneck = e.IsBottleneck
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EquipmentDto>> GetById(Guid id)
    {
        var entity = await _db.Equipments.FindAsync(id);
        if (entity == null) return NotFound();
        return Ok(new EquipmentDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Type = entity.Type,
            LineId = entity.LineId,
            Position = entity.Position,
            NominalSpeed = entity.NominalSpeed,
            X = entity.X,
            Y = entity.Y,
            GatewayDeviceId = entity.GatewayDeviceId,
            CameraDeviceId = entity.CameraDeviceId,
            IsActive = entity.IsActive,
            IsBottleneck = entity.IsBottleneck
        });
    }

    [HttpPost]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<ActionResult<EquipmentDto>> Create([FromBody] CreateEquipmentDto dto)
    {
        var entity = new Equipment
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Type = dto.Type,
            LineId = dto.LineId,
            Position = dto.Position,
            NominalSpeed = dto.NominalSpeed,
            X = dto.X,
            Y = dto.Y
        };
        _db.Equipments.Add(entity);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, new EquipmentDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Type = entity.Type,
            LineId = entity.LineId,
            Position = entity.Position,
            NominalSpeed = entity.NominalSpeed,
            X = entity.X,
            Y = entity.Y,
            GatewayDeviceId = entity.GatewayDeviceId,
            CameraDeviceId = entity.CameraDeviceId,
            IsActive = entity.IsActive,
            IsBottleneck = entity.IsBottleneck
        });
    }

    [HttpPut("{id:guid}")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<ActionResult<EquipmentDto>> Update(Guid id, [FromBody] UpdateEquipmentDto dto)
    {
        var entity = await _db.Equipments.FindAsync(id);
        if (entity == null) return NotFound();
        if (dto.Name != null) entity.Name = dto.Name;
        if (dto.Type != null) entity.Type = dto.Type;
        if (dto.Position.HasValue) entity.Position = dto.Position.Value;
        if (dto.NominalSpeed.HasValue) entity.NominalSpeed = dto.NominalSpeed.Value;
        if (dto.X.HasValue) entity.X = dto.X.Value;
        if (dto.Y.HasValue) entity.Y = dto.Y.Value;
        if (dto.IsActive.HasValue) entity.IsActive = dto.IsActive.Value;
        if (dto.IsBottleneck.HasValue) entity.IsBottleneck = dto.IsBottleneck.Value;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new EquipmentDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Type = entity.Type,
            LineId = entity.LineId,
            Position = entity.Position,
            NominalSpeed = entity.NominalSpeed,
            X = entity.X,
            Y = entity.Y,
            GatewayDeviceId = entity.GatewayDeviceId,
            CameraDeviceId = entity.CameraDeviceId,
            IsActive = entity.IsActive,
            IsBottleneck = entity.IsBottleneck
        });
    }

    [HttpDelete("{id:guid}")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<IActionResult> Delete(Guid id)
    {
        var entity = await _db.Equipments.FindAsync(id);
        if (entity == null) return NotFound();
        _db.Equipments.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>Permite definir bottleneck sem login (Configurações → Bottleneck).</summary>
    [HttpPatch("{id:guid}/bottleneck")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<ActionResult<EquipmentDto>> SetBottleneck(Guid id, [FromBody] SetBottleneckDto dto)
    {
        var entity = await _db.Equipments.FindAsync(id);
        if (entity == null) return NotFound();
        entity.IsBottleneck = dto.IsBottleneck;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new EquipmentDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Type = entity.Type,
            LineId = entity.LineId,
            Position = entity.Position,
            NominalSpeed = entity.NominalSpeed,
            X = entity.X,
            Y = entity.Y,
            GatewayDeviceId = entity.GatewayDeviceId,
            CameraDeviceId = entity.CameraDeviceId,
            IsActive = entity.IsActive,
            IsBottleneck = entity.IsBottleneck
        });
    }

    [HttpPatch("{id:guid}/position")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<ActionResult<EquipmentDto>> UpdatePosition(Guid id, [FromBody] EquipmentPositionDto dto)
    {
        var entity = await _db.Equipments.FindAsync(id);
        if (entity == null) return NotFound();
        entity.X = dto.X;
        entity.Y = dto.Y;
        entity.Position = dto.Position;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new EquipmentDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Type = entity.Type,
            LineId = entity.LineId,
            Position = entity.Position,
            NominalSpeed = entity.NominalSpeed,
            X = entity.X,
            Y = entity.Y,
            GatewayDeviceId = entity.GatewayDeviceId,
            CameraDeviceId = entity.CameraDeviceId,
            IsActive = entity.IsActive,
            IsBottleneck = entity.IsBottleneck
        });
    }
}
