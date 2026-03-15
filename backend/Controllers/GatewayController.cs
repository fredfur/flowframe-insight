using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowVision.API.Data;
using FlowVision.API.DTOs.Gateway;
using FlowVision.API.Services;

namespace FlowVision.API.Controllers;

[ApiController]
[Route("api/gateway")]
[AllowAnonymous]
public class GatewayController : ControllerBase
{
    private readonly ITelemetryProcessor _telemetryProcessor;
    private readonly IGatewayStateStore _gatewayStateStore;
    private readonly AppDbContext _db;

    public GatewayController(ITelemetryProcessor telemetryProcessor, IGatewayStateStore gatewayStateStore, AppDbContext db)
    {
        _telemetryProcessor = telemetryProcessor;
        _gatewayStateStore = gatewayStateStore;
        _db = db;
    }

    /// <summary>
    /// Verifica se o gateway está disponível para receber dados do ESP32.
    /// Requer header X-API-Key. Use para health check ou teste de conectividade.
    /// </summary>
    [HttpGet("status")]
    public IActionResult Status()
    {
        return Ok(new
        {
            status = "ok",
            gateway = "FlowVision",
            message = "Gateway disponível para ingestão de telemetria ESP32",
            endpoints = new[]
            {
                "POST /api/gateway/telemetry",
                "POST /api/gateway/telemetry/batch",
                "POST /api/gateway/heartbeat",
                "POST /api/gateway/transport",
                "POST /api/gateway/error"
            },
            timestamp = DateTime.UtcNow
        });
    }

    [HttpPost("telemetry")]
    public async Task<IActionResult> Telemetry([FromBody] TelemetryPayloadDto dto)
    {
        await _telemetryProcessor.ProcessAsync(dto);
        return Accepted();
    }

    [HttpPost("telemetry/batch")]
    public async Task<IActionResult> TelemetryBatch([FromBody] List<TelemetryPayloadDto> dtos)
    {
        foreach (var dto in dtos ?? new List<TelemetryPayloadDto>())
            await _telemetryProcessor.ProcessAsync(dto);
        return Accepted();
    }

    [HttpPost("heartbeat")]
    public async Task<IActionResult> Heartbeat([FromBody] HeartbeatDto dto)
    {
        _gatewayStateStore.UpdateHeartbeat(
            dto.DeviceId,
            dto.DeviceType,
            dto.LatencyMs,
            dto.MemoryUsagePercent,
            dto.FirmwareVersion,
            dto.Timestamp);
        var device = await _db.Devices.FirstOrDefaultAsync(d => d.ExternalId == dto.DeviceId);
        if (device != null)
        {
            device.LastSeen = dto.Timestamp;
            if (!string.IsNullOrWhiteSpace(dto.Name))
                device.Name = dto.Name.Trim();
            await _db.SaveChangesAsync();
        }
        return Accepted();
    }

    [HttpPost("camera/frame")]
    public IActionResult CameraFrame(IFormFile _)
    {
        return Accepted();
    }

    [HttpPost("transport")]
    public IActionResult Transport([FromBody] TransportPayloadDto dto)
    {
        return Accepted();
    }

    [HttpPost("error")]
    public IActionResult Error([FromBody] ErrorReportDto dto)
    {
        return Accepted();
    }
}
