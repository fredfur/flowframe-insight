using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowVision.API.Data;
using FlowVision.API.DTOs.Realtime;
using FlowVision.API.Services;

namespace FlowVision.API.Controllers;

[ApiController]
[Route("api/realtime")]
[Authorize]
public class RealtimeController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IStopAnalyzer _stopAnalyzer;
    private readonly IShiftManager _shiftManager;

    public RealtimeController(AppDbContext db, IStopAnalyzer stopAnalyzer, IShiftManager shiftManager)
    {
        _db = db;
        _stopAnalyzer = stopAnalyzer;
        _shiftManager = shiftManager;
    }

    /// <summary>Snapshot da linha. OEE/Disponibilidade/Performance = acumulado do turno; Vazão = instantânea. AllowAnonymous para testes sem login.</summary>
    [HttpGet("lines/{lineId:guid}")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<ActionResult<RealtimeLineDataDto>> GetLineSnapshot(Guid lineId)
    {
        var line = await _db.ProductionLines
            .Include(l => l.Equipments)
            .Include(l => l.Transports)
            .FirstOrDefaultAsync(l => l.Id == lineId);
        if (line == null) return NotFound();
        var activeOrder = await _db.ProductionOrders
            .FirstOrDefaultAsync(o => o.LineId == lineId && o.Status == Models.Enums.OrderStatus.InProgress);

        var equipmentIds = line.Equipments.Select(e => e.Id).ToList();
        var recentTelemetry = await _db.MachineTelemetry
            .Where(t => equipmentIds.Contains(t.EquipmentId))
            .OrderByDescending(t => t.Timestamp)
            .Take(equipmentIds.Count * 50)
            .ToListAsync();
        var telemetryByEquipment = recentTelemetry
            .GroupBy(t => t.EquipmentId)
            .ToDictionary(g => g.Key, g => g.First());

        var equipments = new List<EquipmentSnapshotDto>();
        var machines = new List<MachineSnapshotDto>();
        decimal sumOee = 0;
        int sumThroughput = 0;
        int countWithTelemetry = 0;
        var bottleneckOees = new List<decimal>();

        foreach (var e in line.Equipments.OrderBy(e => e.Position))
        {
            var last = telemetryByEquipment.GetValueOrDefault(e.Id);
            var statusStr = last != null ? last.Status.ToString() : "Unknown";
            var throughput = last?.Throughput ?? 0;
            var oee = last?.OEE ?? 0;
            var availability = last?.Availability ?? 0;
            var performance = last?.Performance ?? 0;
            var quality = last?.Quality ?? 0;
            if (last != null) countWithTelemetry++;
            sumOee += oee;
            sumThroughput += throughput;
            if (e.IsBottleneck && last != null)
                bottleneckOees.Add(oee);

            equipments.Add(new EquipmentSnapshotDto
            {
                Id = e.Id,
                Name = e.Name,
                Status = statusStr,
                Throughput = throughput,
                Oee = oee,
                LastUpdate = last?.Timestamp
            });
            machines.Add(new MachineSnapshotDto
            {
                Id = e.Id,
                Name = e.Name,
                Type = e.Type,
                LineId = e.LineId,
                Position = e.Position,
                X = e.X,
                Y = e.Y,
                Status = statusStr.ToLowerInvariant(),
                Oee = oee,
                Availability = availability,
                Performance = performance,
                Quality = quality,
                Throughput = throughput,
                NominalSpeed = e.NominalSpeed
            });
        }

        // Vazão da linha = instantânea (soma da última telemetria por equipamento)
        var lineThroughputInstant = sumThroughput;

        // OEE, Disponibilidade e Performance = acumulado do turno (média da telemetria no turno), normalizados pela nominal da linha
        decimal lineOee;
        decimal lineAvailability;
        decimal linePerformance;
        decimal lineQuality;
        var shiftId = await _shiftManager.GetCurrentShiftIdAsync(line.SiteId, lineId);
        if (shiftId.HasValue)
        {
            var shift = await _db.Shifts.FindAsync(shiftId.Value);
            if (shift != null)
            {
                var now = DateTime.UtcNow;
                var today = now.Date;
                var startToday = today.Add(shift.StartTime.ToTimeSpan());
                var endToday = today.Add(shift.EndTime.ToTimeSpan());
                DateTime shiftStart;
                DateTime shiftEnd;
                if (shift.CrossesMidnight)
                {
                    if (now < endToday)
                    {
                        shiftStart = startToday.AddDays(-1);
                        shiftEnd = endToday;
                    }
                    else
                    {
                        shiftStart = startToday;
                        shiftEnd = endToday.AddDays(1);
                    }
                }
                else
                {
                    shiftStart = startToday;
                    shiftEnd = endToday;
                }

                var shiftTelemetry = await _db.MachineTelemetry
                    .Where(t => equipmentIds.Contains(t.EquipmentId) && t.Timestamp >= shiftStart && t.Timestamp <= shiftEnd)
                    .ToListAsync();

                if (shiftTelemetry.Count > 0)
                {
                    var lineNominal = line.NominalSpeed;
                    var avgOee = shiftTelemetry.Average(t => (double)t.OEE);
                    var avgAvailability = shiftTelemetry.Average(t => (double)t.Availability);
                    var avgThroughput = shiftTelemetry.Average(t => t.Throughput);
                    // Performance acumulada do turno normalizada pela referência de velocidade da linha (nominal)
                    var avgPerformance = lineNominal > 0
                        ? Math.Min(100.0, (double)avgThroughput * 100.0 / lineNominal)
                        : shiftTelemetry.Average(t => (double)t.Performance);
                    var avgQuality = shiftTelemetry.Average(t => (double)t.Quality);

                    lineOee = (decimal)Math.Round(avgOee, 2);
                    lineAvailability = (decimal)Math.Round(avgAvailability, 2);
                    linePerformance = (decimal)Math.Round(avgPerformance, 2);
                    lineQuality = (decimal)Math.Round(avgQuality, 2);
                }
                else
                {
                    // Sem telemetria no turno: usar instantâneo (bottleneck ou média)
                    if (bottleneckOees.Count > 0)
                        lineOee = bottleneckOees.Min();
                    else
                        lineOee = countWithTelemetry > 0 ? sumOee / countWithTelemetry : 0;
                    lineAvailability = lineOee;
                    linePerformance = lineOee;
                    lineQuality = lineOee;
                }
            }
            else
            {
                if (bottleneckOees.Count > 0)
                    lineOee = bottleneckOees.Min();
                else
                    lineOee = countWithTelemetry > 0 ? sumOee / countWithTelemetry : 0;
                lineAvailability = lineOee;
                linePerformance = lineOee;
                lineQuality = lineOee;
            }
        }
        else
        {
            if (bottleneckOees.Count > 0)
                lineOee = bottleneckOees.Min();
            else
                lineOee = countWithTelemetry > 0 ? sumOee / countWithTelemetry : 0;
            lineAvailability = lineOee;
            linePerformance = lineOee;
            lineQuality = lineOee;
        }

        var transports = line.Transports.Select(t => new TransportSnapshotDto
        {
            Id = t.Id,
            AccumulationLevel = "Normal",
            AccumulationPercent = 0,
            CurrentUnits = 0
        }).ToList();

        return Ok(new RealtimeLineDataDto
        {
            LineId = line.Id,
            LineName = line.Name,
            Oee = lineOee,
            Availability = lineAvailability,
            Performance = linePerformance,
            Quality = lineQuality,
            NominalSpeed = line.NominalSpeed,
            Throughput = sumThroughput,
            Equipments = equipments,
            Machines = machines,
            Transports = transports,
            ActiveOrderId = activeOrder?.Id,
            ActiveOrderNumber = activeOrder?.OrderNumber
        });
    }

    [HttpGet("lines/{lineId:guid}/dli")]
    public async Task<ActionResult<List<DLIDataPointDto>>> GetDli(Guid lineId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var line = await _db.ProductionLines.FindAsync(lineId);
        if (line == null) return NotFound();
        return Ok(new List<DLIDataPointDto>());
    }

    [HttpGet("lines/{lineId:guid}/oee-history")]
    public async Task<ActionResult<List<OEEHistoryPointDto>>> GetOeeHistory(Guid lineId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var line = await _db.ProductionLines.FindAsync(lineId);
        if (line == null) return NotFound();
        return Ok(new List<OEEHistoryPointDto>());
    }

    [HttpGet("lines/{lineId:guid}/stops/pareto")]
    public async Task<ActionResult<List<ParetoDataPointDto>>> GetStopsPareto(Guid lineId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var line = await _db.ProductionLines.FindAsync(lineId);
        if (line == null) return NotFound();
        var fromDate = from ?? DateTime.UtcNow.AddDays(-1);
        var toDate = to ?? DateTime.UtcNow;
        var list = await _stopAnalyzer.GetParetoAsync(lineId, fromDate, toDate);
        return Ok(list);
    }

    [HttpGet("lines/{lineId:guid}/timeline")]
    public async Task<ActionResult<List<MachineTimelineDto>>> GetTimeline(Guid lineId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var line = await _db.ProductionLines.FindAsync(lineId);
        if (line == null) return NotFound();
        return Ok(new List<MachineTimelineDto>());
    }

    [HttpGet("lines/{lineId:guid}/speed-samples")]
    public async Task<ActionResult<List<SpeedSampleDto>>> GetSpeedSamples(Guid lineId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var line = await _db.ProductionLines.FindAsync(lineId);
        if (line == null) return NotFound();
        return Ok(new List<SpeedSampleDto>());
    }
}
