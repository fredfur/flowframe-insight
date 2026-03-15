using FlowVision.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FlowVision.API.Data.Configurations;

public class DeviceLogConfiguration : IEntityTypeConfiguration<DeviceLog>
{
    public void Configure(EntityTypeBuilder<DeviceLog> b)
    {
        b.ToTable("device_logs");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityByDefaultColumn();
        b.Property(x => x.DeviceId).HasColumnName("device_id").HasMaxLength(100);
        b.Property(x => x.DeviceType).HasColumnName("device_type").HasConversion<string>();
        b.Property(x => x.EventType).HasColumnName("event_type").HasConversion<string>();
        b.Property(x => x.LatencyMs).HasColumnName("latency_ms");
        b.Property(x => x.Fps).HasColumnName("fps");
        b.Property(x => x.MemoryUsagePercent).HasColumnName("memory_usage_percent");
        b.Property(x => x.FirmwareVersion).HasColumnName("firmware_version").HasMaxLength(50);
        b.Property(x => x.Detail).HasColumnName("detail");
        b.Property(x => x.RawPayload).HasColumnName("raw_payload");
        b.Property(x => x.EquipmentId).HasColumnName("equipment_id");
        b.Property(x => x.LineId).HasColumnName("line_id");
        b.Property(x => x.Timestamp).HasColumnName("timestamp");
        b.HasOne(x => x.Equipment).WithMany().HasForeignKey(x => x.EquipmentId).OnDelete(DeleteBehavior.SetNull);
        b.HasOne(x => x.Line).WithMany().HasForeignKey(x => x.LineId).OnDelete(DeleteBehavior.SetNull);
        b.HasIndex(x => x.Timestamp);
        b.HasIndex(x => new { x.DeviceId, x.Timestamp });
    }
}
