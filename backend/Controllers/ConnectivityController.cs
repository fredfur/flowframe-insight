using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FlowVision.API.DTOs;
using FlowVision.API.Services;

namespace FlowVision.API.Controllers;

[ApiController]
[Route("api/connectivity")]
[Authorize]
public class ConnectivityController : ControllerBase
{
    private readonly IGatewayStateStore _gatewayStateStore;

    public ConnectivityController(IGatewayStateStore gatewayStateStore)
    {
        _gatewayStateStore = gatewayStateStore;
    }

    [HttpGet("status")]
    public ActionResult<ConnectivityStatusDto> GetStatus()
    {
        return Ok(new ConnectivityStatusDto());
    }

    [HttpGet("history")]
    [Authorize(Roles = "Admin")]
    public ActionResult GetHistory()
    {
        return Ok(new List<object>());
    }

    [HttpGet("timeline")]
    [Authorize(Roles = "Admin")]
    public ActionResult GetTimeline()
    {
        return Ok(new List<ConnTimelinePointDto>());
    }
}
