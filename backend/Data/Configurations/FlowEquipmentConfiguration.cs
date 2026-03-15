using FlowVision.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FlowVision.API.Data.Configurations;

public class FlowEquipmentConfiguration : IEntityTypeConfiguration<FlowEquipment>
{
    public void Configure(EntityTypeBuilder<FlowEquipment> b)
    {
        b.ToTable("flow_equipments");
        b.HasKey(x => new { x.FlowId, x.EquipmentId });
        b.Property(x => x.FlowId).HasColumnName("flow_id");
        b.Property(x => x.EquipmentId).HasColumnName("equipment_id");
        b.Property(x => x.OverrideNominalSpeed).HasColumnName("override_nominal_speed");
        b.HasOne(x => x.Flow).WithMany(x => x.FlowEquipments).HasForeignKey(x => x.FlowId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.Equipment).WithMany(x => x.FlowEquipments).HasForeignKey(x => x.EquipmentId).OnDelete(DeleteBehavior.Cascade);
    }
}
