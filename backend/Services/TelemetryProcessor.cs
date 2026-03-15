using System.Text.Json;
using FlowVision.API.Data;
using FlowVision.API.DTOs.Gateway;
using FlowVision.API.Models;
using FlowVision.API.Models.Enums;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using FlowVision.API.Hubs;

namespace FlowVision.API.Services;

public class TelemetryProcessor : ITelemetryProcessor
{
    private readonly AppDbContext _db;
    private readonly IHubContext<ProductionHub> _hub;
    private readonly IOEECalculator _oeeCalc;
    private readonly IShiftManager _shiftManager;
    private readonly IAlertEngine _alertEngine;

    public TelemetryProcessor(AppDbContext db, IHubContext<ProductionHub> hub, IOEECalculator oeeCalc, IShiftManager shiftManager, IAlertEngine alertEngine)
    {
        _db = db;
        _hub = hub;
        _oeeCalc = oeeCalc;
        _shiftManager = shiftManager;
        _alertEngine = alertEngine;
    }

    public async Task ProcessAsync(TelemetryPayloadDto payload)
    {
        if (payload.Measurements == null) return;

        var equipmentIds = new List<Guid>();

        var device = await _db.Devices
            .Include(d => d.Line)
            .FirstOrDefaultAsync(d => d.ExternalId == payload.DeviceId && d.IsActive);
        if (device != null)
        {
            if (device.MeasuresOutputOfEquipmentId.HasValue) equipmentIds.Add(device.MeasuresOutputOfEquipmentId.Value);
            if (device.MeasuresInputOfEquipmentId.HasValue && !equipmentIds.Contains(device.MeasuresInputOfEquipmentId.Value))
                equipmentIds.Add(device.MeasuresInputOfEquipmentId.Value);
        }

        if (equipmentIds.Count == 0)
        {
            var legacy = await _db.Equipments.Include(e => e.Line).FirstOrDefaultAsync(e =>
                e.GatewayDeviceId == payload.DeviceId ||
                (payload.EquipmentId != null && e.Id.ToString() == payload.EquipmentId));
            if (legacy != null) equipmentIds.Add(legacy.Id);
        }

        if (equipmentIds.Count == 0) return;

        foreach (var eqId in equipmentIds)
        {
            var equipment = await _db.Equipments.Include(e => e.Line).FirstOrDefaultAsync(e => e.Id == eqId);
            if (equipment != null)
                await ProcessForEquipmentAsync(equipment, payload);
        }
    }

    private async Task ProcessForEquipmentAsync(Equipment equipment, TelemetryPayloadDto payload)
    {
        var newStatus = (MachineStatus)payload.Measurements!.Status;
        var prevStatus = await _db.MachineTelemetry
            .Where(m => m.EquipmentId == equipment.Id)
            .OrderByDescending(m => m.Timestamp)
            .Select(m => m.Status)
            .FirstOrDefaultAsync();

        var nominalSpeed = equipment.Line.ActiveFlowId != null
            ? (await _db.ProductionFlows.FindAsync(equipment.Line.ActiveFlowId))?.NominalSpeed ?? equipment.Line.NominalSpeed
            : equipment.Line.NominalSpeed;

        var oee = _oeeCalc.Calculate(equipment.Id, payload.Measurements, nominalSpeed);
        var telemetry = new MachineTelemetry
        {
            EquipmentId = equipment.Id,
            Status = newStatus,
            Throughput = payload.Measurements.Throughput,
            Availability = oee.Availability,
            Performance = oee.Performance,
            Quality = oee.Quality,
            OEE = oee.OEE,
            RawPayload = JsonSerializer.Serialize(payload),
            Timestamp = payload.Timestamp
        };
        _db.MachineTelemetry.Add(telemetry);

        if (prevStatus == MachineStatus.Running && newStatus != MachineStatus.Running)
        {
            var shiftId = await _shiftManager.GetCurrentShiftIdAsync(equipment.Line.SiteId, equipment.LineId);
            var orderId = await _db.ProductionOrders.Where(o => o.LineId == equipment.LineId && o.Status == OrderStatus.InProgress).Select(o => o.Id).FirstOrDefaultAsync();
            var stop = new Stop
            {
                EquipmentId = equipment.Id,
                MachineName = equipment.Name,
                LineId = equipment.LineId,
                Category = MapStatusToCategory(newStatus),
                StartTime = payload.Timestamp,
                IsAutoDetected = true,
                ShiftId = shiftId,
                ProductionOrderId = orderId == default ? null : orderId,
                RegisteredBy = "system"
            };
            _db.Stops.Add(stop);
            await _hub.Clients.Group("line-" + equipment.LineId).SendAsync("StopStarted", stop);
        }
        else if (prevStatus != MachineStatus.Running && newStatus == MachineStatus.Running)
        {
            var activeStop = await _db.Stops.FirstOrDefaultAsync(s => s.EquipmentId == equipment.Id && s.EndTime == null && s.IsAutoDetected);
            if (activeStop != null)
            {
                activeStop.EndTime = payload.Timestamp;
                activeStop.DurationMinutes = (int)(payload.Timestamp - activeStop.StartTime).TotalMinutes;
                await _hub.Clients.Group("line-" + equipment.LineId).SendAsync("StopEnded", activeStop);
            }
        }

        await _db.SaveChangesAsync();

        var lineGroup = "line-" + equipment.LineId;
        await _hub.Clients.Group(lineGroup).SendAsync("ThroughputUpdate", new { equipmentId = equipment.Id, throughput = payload.Measurements.Throughput, timestamp = payload.Timestamp });
        if (prevStatus != newStatus)
            await _hub.Clients.Group(lineGroup).SendAsync("MachineStatusChanged", new { equipmentId = equipment.Id, status = newStatus.ToString(), timestamp = payload.Timestamp });
        await _hub.Clients.Group(lineGroup).SendAsync("OEEUpdate", new { lineId = equipment.LineId, oee = new { availability = oee.Availability, performance = oee.Performance, quality = oee.Quality, oee = oee.OEE } });
    }

    private static StopCategory MapStatusToCategory(MachineStatus s)
    {
        return s switch { MachineStatus.Fault => StopCategory.Maintenance, MachineStatus.Setup => StopCategory.Setup, MachineStatus.Shortage => StopCategory.MaterialShortage, MachineStatus.Scheduled => StopCategory.Planned, _ => StopCategory.Other };
    }
}
