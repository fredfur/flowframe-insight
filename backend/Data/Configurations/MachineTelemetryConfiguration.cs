using FlowVision.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FlowVision.API.Data.Configurations;

public class MachineTelemetryConfiguration : IEntityTypeConfiguration<MachineTelemetry>
{
    public void Configure(EntityTypeBuilder<MachineTelemetry> b)
    {
        b.ToTable("machine_telemetry");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityByDefaultColumn();
        b.Property(x => x.EquipmentId).HasColumnName("equipment_id");
        b.Property(x => x.Status).HasColumnName("status").HasConversion<string>();
        b.Property(x => x.Throughput).HasColumnName("throughput");
        b.Property(x => x.Availability).HasColumnName("availability").HasPrecision(5, 2);
        b.Property(x => x.Performance).HasColumnName("performance").HasPrecision(5, 2);
        b.Property(x => x.Quality).HasColumnName("quality").HasPrecision(5, 2);
        b.Property(x => x.OEE).HasColumnName("oee").HasPrecision(5, 2);
        b.Property(x => x.RawPayload).HasColumnName("raw_payload");
        b.Property(x => x.Timestamp).HasColumnName("timestamp");
        b.HasOne(x => x.Equipment).WithMany(x => x.TelemetryHistory).HasForeignKey(x => x.EquipmentId).OnDelete(DeleteBehavior.Cascade);
        b.HasIndex(x => new { x.EquipmentId, x.Timestamp });
    }
}
