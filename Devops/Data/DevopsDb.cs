namespace Devops.Data;

using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

public class DevopsUser : IdentityUser<int>
{
    public bool IsAdmin { get; set; }
}

public class DevopsDb : IdentityDbContext<DevopsUser, IdentityRole<int>, int>
{
    public DevopsDb(DbContextOptions<DevopsDb> options) : base(options) { }
}
