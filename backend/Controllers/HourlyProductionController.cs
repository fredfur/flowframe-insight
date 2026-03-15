using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowVision.API.Data;
using FlowVision.API.DTOs;
using FlowVision.API.Models;

namespace FlowVision.API.Controllers;

[ApiController]
[Route("api/orders")]
[Authorize]
public class HourlyProductionController : ControllerBase
{
    private readonly AppDbContext _db;

    public HourlyProductionController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("{orderId:guid}/hourly")]
    public async Task<ActionResult<List<HourlyProductionDto>>> GetByOrder(Guid orderId)
    {
        var list = await _db.HourlyProductions
            .Where(h => h.OrderId == orderId)
            .Select(h => new HourlyProductionDto
            {
                Id = h.Id,
                OrderId = h.OrderId,
                LineId = h.LineId,
                HourStart = h.HourStart,
                PlannedQuantity = h.PlannedQuantity,
                ActualQuantity = h.ActualQuantity,
                RejectedQuantity = h.RejectedQuantity,
                Operator = h.Operator,
                Notes = h.Notes
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpPost("{orderId:guid}/hourly")]
    public async Task<ActionResult<HourlyProductionDto>> Create(Guid orderId, [FromBody] CreateHourlyProductionDto dto)
    {
        var order = await _db.ProductionOrders.FindAsync(orderId);
        if (order == null) return NotFound();
        var entity = new HourlyProduction
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            LineId = order.LineId,
            HourStart = dto.HourStart,
            PlannedQuantity = dto.PlannedQuantity,
            ActualQuantity = dto.ActualQuantity,
            RejectedQuantity = dto.RejectedQuantity,
            Operator = dto.Operator,
            Notes = dto.Notes
        };
        _db.HourlyProductions.Add(entity);
        await _db.SaveChangesAsync();
        return Ok(new HourlyProductionDto
        {
            Id = entity.Id,
            OrderId = entity.OrderId,
            LineId = entity.LineId,
            HourStart = entity.HourStart,
            PlannedQuantity = entity.PlannedQuantity,
            ActualQuantity = entity.ActualQuantity,
            RejectedQuantity = entity.RejectedQuantity,
            Operator = entity.Operator,
            Notes = entity.Notes
        });
    }

    [HttpPut("hourly/{id:guid}")]
    public async Task<ActionResult<HourlyProductionDto>> Update(Guid id, [FromBody] UpdateHourlyProductionDto dto)
    {
        var entity = await _db.HourlyProductions.FindAsync(id);
        if (entity == null) return NotFound();
        if (dto.PlannedQuantity.HasValue) entity.PlannedQuantity = dto.PlannedQuantity.Value;
        if (dto.ActualQuantity.HasValue) entity.ActualQuantity = dto.ActualQuantity.Value;
        if (dto.RejectedQuantity.HasValue) entity.RejectedQuantity = dto.RejectedQuantity.Value;
        if (dto.Operator != null) entity.Operator = dto.Operator;
        if (dto.Notes != null) entity.Notes = dto.Notes;
        await _db.SaveChangesAsync();
        return Ok(new HourlyProductionDto
        {
            Id = entity.Id,
            OrderId = entity.OrderId,
            LineId = entity.LineId,
            HourStart = entity.HourStart,
            PlannedQuantity = entity.PlannedQuantity,
            ActualQuantity = entity.ActualQuantity,
            RejectedQuantity = entity.RejectedQuantity,
            Operator = entity.Operator,
            Notes = entity.Notes
        });
    }
}
