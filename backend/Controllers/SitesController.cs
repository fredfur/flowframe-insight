using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowVision.API.Data;
using FlowVision.API.DTOs;
using FlowVision.API.Models;

namespace FlowVision.API.Controllers;

[ApiController]
[Route("api/sites")]
public class SitesController : ControllerBase
{
    private readonly AppDbContext _db;

    public SitesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<ActionResult<List<SiteDto>>> GetAll()
    {
        var list = await _db.Sites
            .Select(s => new SiteDto
            {
                Id = s.Id,
                Name = s.Name,
                Location = s.Location,
                Timezone = s.Timezone,
                IsActive = s.IsActive
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<ActionResult<SiteDto>> GetById(Guid id)
    {
        var site = await _db.Sites.FindAsync(id);
        if (site == null) return NotFound();
        return Ok(new SiteDto
        {
            Id = site.Id,
            Name = site.Name,
            Location = site.Location,
            Timezone = site.Timezone,
            IsActive = site.IsActive
        });
    }

    [HttpPost]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<ActionResult<SiteDto>> Create([FromBody] CreateSiteDto dto)
    {
        var entity = new Site
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Location = dto.Location,
            Timezone = dto.Timezone
        };
        _db.Sites.Add(entity);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, new SiteDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Location = entity.Location,
            Timezone = entity.Timezone,
            IsActive = entity.IsActive
        });
    }

    [HttpPut("{id:guid}")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<ActionResult<SiteDto>> Update(Guid id, [FromBody] UpdateSiteDto dto)
    {
        var entity = await _db.Sites.FindAsync(id);
        if (entity == null) return NotFound();
        if (dto.Name != null) entity.Name = dto.Name;
        if (dto.Location != null) entity.Location = dto.Location;
        if (dto.Timezone != null) entity.Timezone = dto.Timezone;
        if (dto.IsActive.HasValue) entity.IsActive = dto.IsActive.Value;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new SiteDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Location = entity.Location,
            Timezone = entity.Timezone,
            IsActive = entity.IsActive
        });
    }

    [HttpDelete("{id:guid}")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<IActionResult> Delete(Guid id)
    {
        var entity = await _db.Sites.FindAsync(id);
        if (entity == null) return NotFound();
        _db.Sites.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
