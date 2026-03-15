using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowVision.API.Data;
using FlowVision.API.DTOs;
using FlowVision.API.Models;

namespace FlowVision.API.Controllers;

[ApiController]
[Route("api/lines")]
public class LinesController : ControllerBase
{
    private readonly AppDbContext _db;

    public LinesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<LineDto>>> GetAll()
    {
        var list = await _db.ProductionLines
            .Select(l => new LineDto
            {
                Id = l.Id,
                Name = l.Name,
                Type = l.Type,
                SiteId = l.SiteId,
                NominalSpeed = l.NominalSpeed,
                IsActive = l.IsActive,
                ActiveFlowId = l.ActiveFlowId
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("~/api/sites/{siteId:guid}/lines")]
    public async Task<ActionResult<List<LineDto>>> GetBySite(Guid siteId)
    {
        var list = await _db.ProductionLines
            .Where(l => l.SiteId == siteId)
            .Select(l => new LineDto
            {
                Id = l.Id,
                Name = l.Name,
                Type = l.Type,
                SiteId = l.SiteId,
                NominalSpeed = l.NominalSpeed,
                IsActive = l.IsActive,
                ActiveFlowId = l.ActiveFlowId
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<LineDto>> GetById(Guid id)
    {
        var line = await _db.ProductionLines.FindAsync(id);
        if (line == null) return NotFound();
        return Ok(new LineDto
        {
            Id = line.Id,
            Name = line.Name,
            Type = line.Type,
            SiteId = line.SiteId,
            NominalSpeed = line.NominalSpeed,
            IsActive = line.IsActive,
            ActiveFlowId = line.ActiveFlowId
        });
    }

    [HttpPost]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<ActionResult<LineDto>> Create([FromBody] CreateLineDto dto)
    {
        var entity = new ProductionLine
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Type = dto.Type,
            SiteId = dto.SiteId,
            NominalSpeed = dto.NominalSpeed
        };
        _db.ProductionLines.Add(entity);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, new LineDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Type = entity.Type,
            SiteId = entity.SiteId,
            NominalSpeed = entity.NominalSpeed,
            IsActive = entity.IsActive,
            ActiveFlowId = entity.ActiveFlowId
        });
    }

    [HttpPut("{id:guid}")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<ActionResult<LineDto>> Update(Guid id, [FromBody] UpdateLineDto dto)
    {
        var entity = await _db.ProductionLines.FindAsync(id);
        if (entity == null) return NotFound();
        if (dto.Name != null) entity.Name = dto.Name;
        if (dto.Type != null) entity.Type = dto.Type;
        if (dto.NominalSpeed.HasValue) entity.NominalSpeed = dto.NominalSpeed.Value;
        if (dto.IsActive.HasValue) entity.IsActive = dto.IsActive.Value;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new LineDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Type = entity.Type,
            SiteId = entity.SiteId,
            NominalSpeed = entity.NominalSpeed,
            IsActive = entity.IsActive,
            ActiveFlowId = entity.ActiveFlowId
        });
    }

    [HttpDelete("{id:guid}")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<IActionResult> Delete(Guid id)
    {
        var entity = await _db.ProductionLines.FindAsync(id);
        if (entity == null) return NotFound();
        _db.ProductionLines.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:guid}/activate-flow")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<LineDto>> ActivateFlow(Guid id, [FromBody] ActivateFlowDto dto)
    {
        var entity = await _db.ProductionLines.FindAsync(id);
        if (entity == null) return NotFound();
        entity.ActiveFlowId = dto.FlowId;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new LineDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Type = entity.Type,
            SiteId = entity.SiteId,
            NominalSpeed = entity.NominalSpeed,
            IsActive = entity.IsActive,
            ActiveFlowId = entity.ActiveFlowId
        });
    }
}
