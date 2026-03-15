using FlowVision.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FlowVision.API.Data.Configurations;

public class ShiftConfiguration : IEntityTypeConfiguration<Shift>
{
    public void Configure(EntityTypeBuilder<Shift> b)
    {
        b.ToTable("shifts");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.SiteId).HasColumnName("site_id");
        b.Property(x => x.LineId).HasColumnName("line_id");
        b.Property(x => x.Name).HasColumnName("name").HasMaxLength(100);
        b.Property(x => x.StartTime).HasColumnName("start_time");
        b.Property(x => x.EndTime).HasColumnName("end_time");
        b.Property(x => x.CrossesMidnight).HasColumnName("crosses_midnight");
        b.Property(x => x.IsActive).HasColumnName("is_active");
        b.Property(x => x.CreatedAt).HasColumnName("created_at");
        b.HasOne(x => x.Site).WithMany().HasForeignKey(x => x.SiteId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.Line).WithMany(x => x.Shifts).HasForeignKey(x => x.LineId).OnDelete(DeleteBehavior.Cascade);
    }
}
