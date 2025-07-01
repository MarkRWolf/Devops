namespace Devops.Data;

using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;


public class DevopsDb : IdentityDbContext<DevopsUser, IdentityRole<Guid>, Guid>
{
    public DevopsDb(DbContextOptions<DevopsDb> options) : base(options) { }

    
}
