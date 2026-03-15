namespace FlowVision.API.DTOs.Realtime;

public class RealtimeLineDataDto
{
    public Guid LineId { get; set; }
    public string LineName { get; set; } = string.Empty;
    public decimal Oee { get; set; }
    public decimal Availability { get; set; }
    public decimal Performance { get; set; }
    public decimal Quality { get; set; }
    public int NominalSpeed { get; set; }
    public int Throughput { get; set; }
    public List<EquipmentSnapshotDto> Equipments { get; set; } = new();
    /// <summary>Machine snapshots for frontend (id, name, type, lineId, position, status, oee, throughput).</summary>
    public List<MachineSnapshotDto> Machines { get; set; } = new();
    public List<TransportSnapshotDto> Transports { get; set; } = new();
    public Guid? ActiveOrderId { get; set; }
    public string? ActiveOrderNumber { get; set; }
}

public class MachineSnapshotDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public Guid LineId { get; set; }
    public int Position { get; set; }
    public double X { get; set; }
    public double Y { get; set; }
    public string Status { get; set; } = "unknown";
    public decimal Oee { get; set; }
    public decimal Availability { get; set; }
    public decimal Performance { get; set; }
    public decimal Quality { get; set; }
    public int Throughput { get; set; }
    public int NominalSpeed { get; set; }
}

public class EquipmentSnapshotDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int Throughput { get; set; }
    public decimal Oee { get; set; }
    public DateTime? LastUpdate { get; set; }
}

public class TransportSnapshotDto
{
    public Guid Id { get; set; }
    public string AccumulationLevel { get; set; } = string.Empty;
    public int AccumulationPercent { get; set; }
    public int CurrentUnits { get; set; }
}
