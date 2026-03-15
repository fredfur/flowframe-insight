using FlowVision.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FlowVision.API.Data.Configurations;

public class DeviceConfiguration : IEntityTypeConfiguration<Device>
{
    public void Configure(EntityTypeBuilder<Device> b)
    {
        b.ToTable("devices");
        b.HasKey(x => x.Id);
        b.Property(x => x.ExternalId).HasColumnName("external_id").HasMaxLength(100).IsRequired();
        b.Property(x => x.Name).HasColumnName("name").HasMaxLength(200);
        b.Property(x => x.LineId).HasColumnName("line_id");
        b.Property(x => x.MeasuresOutputOfEquipmentId).HasColumnName("measures_output_of_equipment_id");
        b.Property(x => x.MeasuresInputOfEquipmentId).HasColumnName("measures_input_of_equipment_id");
        b.Property(x => x.StreamUrl).HasColumnName("stream_url").HasMaxLength(500);
        b.Property(x => x.LastSeen).HasColumnName("last_seen");
        b.Property(x => x.IsActive).HasColumnName("is_active");
        b.Property(x => x.CreatedAt).HasColumnName("created_at");
        b.Property(x => x.UpdatedAt).HasColumnName("updated_at");

        b.HasOne(x => x.Line).WithMany().HasForeignKey(x => x.LineId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.MeasuresOutputOfEquipment).WithMany().HasForeignKey(x => x.MeasuresOutputOfEquipmentId).OnDelete(DeleteBehavior.SetNull);
        b.HasOne(x => x.MeasuresInputOfEquipment).WithMany().HasForeignKey(x => x.MeasuresInputOfEquipmentId).OnDelete(DeleteBehavior.SetNull);
        b.HasIndex(x => x.ExternalId).IsUnique();
        b.HasIndex(x => x.LineId);
    }
}
