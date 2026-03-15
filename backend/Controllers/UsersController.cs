using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowVision.API.Data;
using FlowVision.API.DTOs;
using FlowVision.API.Models;
using FlowVision.API.Models.Enums;

namespace FlowVision.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetAll()
    {
        var list = await _db.AppUsers
            .Select(u => new UserDto
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email,
                Role = u.Role.ToString(),
                SiteId = u.SiteId,
                IsActive = u.IsActive
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserDto>> GetById(Guid id)
    {
        var entity = await _db.AppUsers.FindAsync(id);
        if (entity == null) return NotFound();
        return Ok(new UserDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Email = entity.Email,
            Role = entity.Role.ToString(),
            SiteId = entity.SiteId,
            IsActive = entity.IsActive
        });
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> Create([FromBody] CreateUserDto dto)
    {
        if (await _db.AppUsers.AnyAsync(u => u.Email == dto.Email))
            return BadRequest();
        if (!Enum.TryParse<UserRole>(dto.Role, true, out var role)) role = UserRole.Operacao;
        var entity = new AppUser
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = role,
            SiteId = dto.SiteId
        };
        _db.AppUsers.Add(entity);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, new UserDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Email = entity.Email,
            Role = entity.Role.ToString(),
            SiteId = entity.SiteId,
            IsActive = entity.IsActive
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<UserDto>> Update(Guid id, [FromBody] UpdateUserDto dto)
    {
        var entity = await _db.AppUsers.FindAsync(id);
        if (entity == null) return NotFound();
        if (dto.Name != null) entity.Name = dto.Name;
        if (dto.Email != null) entity.Email = dto.Email;
        if (dto.Role != null && Enum.TryParse<UserRole>(dto.Role, true, out var r)) entity.Role = r;
        if (dto.SiteId.HasValue) entity.SiteId = dto.SiteId;
        if (dto.IsActive.HasValue) entity.IsActive = dto.IsActive.Value;
        await _db.SaveChangesAsync();
        return Ok(new UserDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Email = entity.Email,
            Role = entity.Role.ToString(),
            SiteId = entity.SiteId,
            IsActive = entity.IsActive
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var entity = await _db.AppUsers.FindAsync(id);
        if (entity == null) return NotFound();
        _db.AppUsers.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:guid}/assign")]
    public async Task<IActionResult> AssignEquipment(Guid id, [FromBody] UserAssignEquipmentDto dto)
    {
        var user = await _db.AppUsers.Include(u => u.OperatorAssignments).FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound();
        var existing = user.OperatorAssignments.Where(a => a.UnassignedAt == null).ToList();
        foreach (var a in existing)
            a.UnassignedAt = DateTime.UtcNow;
        foreach (var eqId in dto.EquipmentIds ?? new List<Guid>())
            _db.OperatorAssignments.Add(new OperatorAssignment { UserId = id, EquipmentId = eqId });
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
