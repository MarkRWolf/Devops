namespace Devops.Data;

using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;


public class DevopsDb : IdentityDbContext<DevopsUser, IdentityRole<Guid>, Guid>
{
    public DevopsDb(DbContextOptions<DevopsDb> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);
        b.Entity<DevopsUser>(u =>
        {
            u.Property(e => e.Email).IsRequired();
            u.HasIndex(e => e.NormalizedEmail).IsUnique();
            u.Property(e => e.UserName).IsRequired();
        });
    }
}
