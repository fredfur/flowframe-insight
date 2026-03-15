using FlowVision.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FlowVision.API.Data.Configurations;

public class EquipmentConfiguration : IEntityTypeConfiguration<Equipment>
{
    public void Configure(EntityTypeBuilder<Equipment> b)
    {
        b.ToTable("equipments");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).HasColumnName("name").HasMaxLength(200);
        b.Property(x => x.Type).HasColumnName("type").HasMaxLength(100);
        b.Property(x => x.LineId).HasColumnName("line_id");
        b.Property(x => x.Position).HasColumnName("position");
        b.Property(x => x.NominalSpeed).HasColumnName("nominal_speed");
        b.Property(x => x.X).HasColumnName("x");
        b.Property(x => x.Y).HasColumnName("y");
        b.Property(x => x.GatewayDeviceId).HasColumnName("gateway_device_id").HasMaxLength(100);
        b.Property(x => x.CameraDeviceId).HasColumnName("camera_device_id").HasMaxLength(100);
        b.Property(x => x.IsActive).HasColumnName("is_active");
        b.Property(x => x.IsBottleneck).HasColumnName("is_bottleneck");
        b.Property(x => x.CreatedAt).HasColumnName("created_at");
        b.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        b.HasOne(x => x.Line).WithMany(x => x.Equipments).HasForeignKey(x => x.LineId).OnDelete(DeleteBehavior.Cascade);
    }
}
