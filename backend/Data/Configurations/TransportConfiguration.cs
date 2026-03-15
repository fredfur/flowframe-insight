using FlowVision.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FlowVision.API.Data.Configurations;

public class TransportConfiguration : IEntityTypeConfiguration<Transport>
{
    public void Configure(EntityTypeBuilder<Transport> b)
    {
        b.ToTable("transports");
        b.HasKey(x => x.Id);
        b.Property(x => x.LineId).HasColumnName("line_id");
        b.Property(x => x.FromPosition).HasColumnName("from_position");
        b.Property(x => x.ToPosition).HasColumnName("to_position");
        b.Property(x => x.Type).HasColumnName("type").HasConversion<string>();
        b.Property(x => x.Capacity).HasColumnName("capacity");
        b.Property(x => x.SensorDeviceId).HasColumnName("sensor_device_id").HasMaxLength(100);
        b.Property(x => x.CreatedAt).HasColumnName("created_at");
        b.HasOne(x => x.Line).WithMany(x => x.Transports).HasForeignKey(x => x.LineId).OnDelete(DeleteBehavior.Cascade);
    }
}
