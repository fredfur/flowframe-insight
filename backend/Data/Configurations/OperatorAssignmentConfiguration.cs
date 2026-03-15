using FlowVision.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FlowVision.API.Data.Configurations;

public class OperatorAssignmentConfiguration : IEntityTypeConfiguration<OperatorAssignment>
{
    public void Configure(EntityTypeBuilder<OperatorAssignment> b)
    {
        b.ToTable("operator_assignments");
        b.HasKey(x => x.Id);
        b.Property(x => x.UserId).HasColumnName("user_id");
        b.Property(x => x.EquipmentId).HasColumnName("equipment_id");
        b.Property(x => x.AssignedAt).HasColumnName("assigned_at");
        b.Property(x => x.UnassignedAt).HasColumnName("unassigned_at");
        b.HasOne(x => x.User).WithMany(x => x.OperatorAssignments).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.Equipment).WithMany(x => x.OperatorAssignments).HasForeignKey(x => x.EquipmentId).OnDelete(DeleteBehavior.Cascade);
    }
}
