using FlowVision.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FlowVision.API.Data.Configurations;

public class TransportTelemetryConfiguration : IEntityTypeConfiguration<TransportTelemetry>
{
    public void Configure(EntityTypeBuilder<TransportTelemetry> b)
    {
        b.ToTable("transport_telemetry");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityByDefaultColumn();
        b.Property(x => x.TransportId).HasColumnName("transport_id");
        b.Property(x => x.AccumulationLevel).HasColumnName("accumulation_level").HasConversion<string>();
        b.Property(x => x.AccumulationPercent).HasColumnName("accumulation_percent");
        b.Property(x => x.CurrentUnits).HasColumnName("current_units");
        b.Property(x => x.RawPayload).HasColumnName("raw_payload");
        b.Property(x => x.Timestamp).HasColumnName("timestamp");
        b.HasOne(x => x.Transport).WithMany(x => x.TelemetryHistory).HasForeignKey(x => x.TransportId).OnDelete(DeleteBehavior.Cascade);
        b.HasIndex(x => new { x.TransportId, x.Timestamp });
    }
}
