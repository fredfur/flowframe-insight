using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowVision.API.Data;
using FlowVision.API.DTOs;
using FlowVision.API.Models;
using FlowVision.API.Models.Enums;

namespace FlowVision.API.Controllers;

[ApiController]
[Route("api/orders")]
[Authorize]
public class ProductionOrdersController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProductionOrdersController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<OrderDto>>> GetAll([FromQuery] Guid? lineId, [FromQuery] string? status)
    {
        var query = _db.ProductionOrders.AsQueryable();
        if (lineId.HasValue) query = query.Where(o => o.LineId == lineId.Value);
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, true, out var st))
            query = query.Where(o => o.Status == st);
        var list = await query
            .Select(o => new OrderDto
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                FlowId = o.FlowId,
                LineId = o.LineId,
                TargetQuantity = o.TargetQuantity,
                ProducedQuantity = o.ProducedQuantity,
                RejectedQuantity = o.RejectedQuantity,
                Status = o.Status.ToString(),
                PlannedStart = o.PlannedStart,
                PlannedEnd = o.PlannedEnd,
                ActualStart = o.ActualStart,
                ActualEnd = o.ActualEnd,
                Notes = o.Notes
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OrderDto>> GetById(Guid id)
    {
        var entity = await _db.ProductionOrders.FindAsync(id);
        if (entity == null) return NotFound();
        return Ok(new OrderDto
        {
            Id = entity.Id,
            OrderNumber = entity.OrderNumber,
            FlowId = entity.FlowId,
            LineId = entity.LineId,
            TargetQuantity = entity.TargetQuantity,
            ProducedQuantity = entity.ProducedQuantity,
            RejectedQuantity = entity.RejectedQuantity,
            Status = entity.Status.ToString(),
            PlannedStart = entity.PlannedStart,
            PlannedEnd = entity.PlannedEnd,
            ActualStart = entity.ActualStart,
            ActualEnd = entity.ActualEnd,
            Notes = entity.Notes
        });
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Lideranca")]
    public async Task<ActionResult<OrderDto>> Create([FromBody] CreateOrderDto dto)
    {
        var entity = new ProductionOrder
        {
            Id = Guid.NewGuid(),
            OrderNumber = dto.OrderNumber,
            FlowId = dto.FlowId,
            LineId = dto.LineId,
            TargetQuantity = dto.TargetQuantity,
            PlannedStart = dto.PlannedStart,
            PlannedEnd = dto.PlannedEnd,
            Notes = dto.Notes
        };
        _db.ProductionOrders.Add(entity);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, new OrderDto
        {
            Id = entity.Id,
            OrderNumber = entity.OrderNumber,
            FlowId = entity.FlowId,
            LineId = entity.LineId,
            TargetQuantity = entity.TargetQuantity,
            ProducedQuantity = entity.ProducedQuantity,
            RejectedQuantity = entity.RejectedQuantity,
            Status = entity.Status.ToString(),
            PlannedStart = entity.PlannedStart,
            PlannedEnd = entity.PlannedEnd,
            ActualStart = entity.ActualStart,
            ActualEnd = entity.ActualEnd,
            Notes = entity.Notes
        });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Lideranca")]
    public async Task<ActionResult<OrderDto>> Update(Guid id, [FromBody] UpdateOrderDto dto)
    {
        var entity = await _db.ProductionOrders.FindAsync(id);
        if (entity == null) return NotFound();
        if (dto.TargetQuantity.HasValue) entity.TargetQuantity = dto.TargetQuantity.Value;
        if (dto.PlannedStart.HasValue) entity.PlannedStart = dto.PlannedStart.Value;
        if (dto.PlannedEnd.HasValue) entity.PlannedEnd = dto.PlannedEnd;
        if (dto.Notes != null) entity.Notes = dto.Notes;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new OrderDto
        {
            Id = entity.Id,
            OrderNumber = entity.OrderNumber,
            FlowId = entity.FlowId,
            LineId = entity.LineId,
            TargetQuantity = entity.TargetQuantity,
            ProducedQuantity = entity.ProducedQuantity,
            RejectedQuantity = entity.RejectedQuantity,
            Status = entity.Status.ToString(),
            PlannedStart = entity.PlannedStart,
            PlannedEnd = entity.PlannedEnd,
            ActualStart = entity.ActualStart,
            ActualEnd = entity.ActualEnd,
            Notes = entity.Notes
        });
    }

    [HttpPatch("{id:guid}/start")]
    [Authorize(Roles = "Admin,Lideranca,Operacao")]
    public async Task<ActionResult<OrderDto>> Start(Guid id)
    {
        var entity = await _db.ProductionOrders.FindAsync(id);
        if (entity == null) return NotFound();
        entity.Status = OrderStatus.InProgress;
        entity.ActualStart = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new OrderDto
        {
            Id = entity.Id,
            OrderNumber = entity.OrderNumber,
            FlowId = entity.FlowId,
            LineId = entity.LineId,
            TargetQuantity = entity.TargetQuantity,
            ProducedQuantity = entity.ProducedQuantity,
            RejectedQuantity = entity.RejectedQuantity,
            Status = entity.Status.ToString(),
            PlannedStart = entity.PlannedStart,
            PlannedEnd = entity.PlannedEnd,
            ActualStart = entity.ActualStart,
            ActualEnd = entity.ActualEnd,
            Notes = entity.Notes
        });
    }

    [HttpPatch("{id:guid}/complete")]
    [Authorize(Roles = "Admin,Lideranca")]
    public async Task<ActionResult<OrderDto>> Complete(Guid id)
    {
        var entity = await _db.ProductionOrders.FindAsync(id);
        if (entity == null) return NotFound();
        entity.Status = OrderStatus.Completed;
        entity.ActualEnd = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new OrderDto
        {
            Id = entity.Id,
            OrderNumber = entity.OrderNumber,
            FlowId = entity.FlowId,
            LineId = entity.LineId,
            TargetQuantity = entity.TargetQuantity,
            ProducedQuantity = entity.ProducedQuantity,
            RejectedQuantity = entity.RejectedQuantity,
            Status = entity.Status.ToString(),
            PlannedStart = entity.PlannedStart,
            PlannedEnd = entity.PlannedEnd,
            ActualStart = entity.ActualStart,
            ActualEnd = entity.ActualEnd,
            Notes = entity.Notes
        });
    }

    [HttpPatch("{id:guid}/cancel")]
    [Authorize(Roles = "Admin,Lideranca")]
    public async Task<ActionResult<OrderDto>> Cancel(Guid id, [FromBody] CancelOrderDto dto)
    {
        var entity = await _db.ProductionOrders.FindAsync(id);
        if (entity == null) return NotFound();
        entity.Status = OrderStatus.Cancelled;
        if (dto.Reason != null) entity.Notes = (entity.Notes ?? "") + " [Cancel: " + dto.Reason + "]";
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new OrderDto
        {
            Id = entity.Id,
            OrderNumber = entity.OrderNumber,
            FlowId = entity.FlowId,
            LineId = entity.LineId,
            TargetQuantity = entity.TargetQuantity,
            ProducedQuantity = entity.ProducedQuantity,
            RejectedQuantity = entity.RejectedQuantity,
            Status = entity.Status.ToString(),
            PlannedStart = entity.PlannedStart,
            PlannedEnd = entity.PlannedEnd,
            ActualStart = entity.ActualStart,
            ActualEnd = entity.ActualEnd,
            Notes = entity.Notes
        });
    }
}
