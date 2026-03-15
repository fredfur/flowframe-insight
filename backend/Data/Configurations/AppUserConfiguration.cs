using FlowVision.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FlowVision.API.Data.Configurations;

public class AppUserConfiguration : IEntityTypeConfiguration<AppUser>
{
    public void Configure(EntityTypeBuilder<AppUser> b)
    {
        b.ToTable("app_users");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).HasColumnName("name").HasMaxLength(200);
        b.Property(x => x.Email).HasColumnName("email").HasMaxLength(300);
        b.Property(x => x.PasswordHash).HasColumnName("password_hash").HasMaxLength(500);
        b.Property(x => x.Role).HasColumnName("role").HasConversion<string>();
        b.Property(x => x.SiteId).HasColumnName("site_id");
        b.Property(x => x.IsActive).HasColumnName("is_active");
        b.Property(x => x.LastLoginAt).HasColumnName("last_login_at");
        b.Property(x => x.CreatedAt).HasColumnName("created_at");
        b.HasOne(x => x.Site).WithMany(x => x.Users).HasForeignKey(x => x.SiteId).OnDelete(DeleteBehavior.SetNull);
    }
}
