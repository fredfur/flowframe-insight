using FlowVision.API.Models.Enums;

namespace FlowVision.API.DTOs;

public class TransportDto
{
    public Guid Id { get; set; }
    public Guid LineId { get; set; }
    public int FromPosition { get; set; }
    public int ToPosition { get; set; }
    public string Type { get; set; } = "Conveyor";
    public int Capacity { get; set; }
    public string? SensorDeviceId { get; set; }
}

public class CreateTransportDto
{
    public Guid LineId { get; set; }
    public int FromPosition { get; set; }
    public int ToPosition { get; set; }
    public TransportType Type { get; set; } = TransportType.Conveyor;
    public int Capacity { get; set; }
    public string? SensorDeviceId { get; set; }
}

public class UpdateTransportDto
{
    public int? FromPosition { get; set; }
    public int? ToPosition { get; set; }
    public TransportType? Type { get; set; }
    public int? Capacity { get; set; }
    public string? SensorDeviceId { get; set; }
}
