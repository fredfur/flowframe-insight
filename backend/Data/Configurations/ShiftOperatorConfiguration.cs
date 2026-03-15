using FlowVision.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FlowVision.API.Data.Configurations;

public class ShiftOperatorConfiguration : IEntityTypeConfiguration<ShiftOperator>
{
    public void Configure(EntityTypeBuilder<ShiftOperator> b)
    {
        b.ToTable("shift_operators");
        b.HasKey(x => new { x.ShiftId, x.UserId });
        b.Property(x => x.ShiftId).HasColumnName("shift_id");
        b.Property(x => x.UserId).HasColumnName("user_id");
        b.Property(x => x.AssignedAt).HasColumnName("assigned_at");
        b.HasOne(x => x.Shift).WithMany(x => x.ShiftOperators).HasForeignKey(x => x.ShiftId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.User).WithMany(x => x.ShiftAssignments).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}
