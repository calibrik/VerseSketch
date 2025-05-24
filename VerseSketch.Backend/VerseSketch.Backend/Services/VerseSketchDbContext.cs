using Microsoft.EntityFrameworkCore;

namespace VerseSketch.Backend.Models;

public class VerseSketchDbContext:DbContext
{
    public DbSet<Room> Rooms { get; set; }
    public DbSet<Player> Players { get; set; }
    
    public VerseSketchDbContext(DbContextOptions options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // modelBuilder.Entity<Room>().HasMany(r => r.Players).WithOne(p => p.Room).HasForeignKey(p => p.RoomTitle).OnDelete(DeleteBehavior.Cascade);
        // modelBuilder.Entity<Room>().HasOne(r => r.Admin).WithMany().HasForeignKey(r => r.AdminId).OnDelete(DeleteBehavior.Cascade);
        // modelBuilder.Entity<Room>().HasKey(r => r.Title);
        // modelBuilder.Entity<Room>().Property(r => r.Title).HasMaxLength(40);
        // modelBuilder.Entity<Player>().Property(p => p.Nickname).HasMaxLength(30);
        // modelBuilder.Entity<Player>().HasIndex(p => new {p.Nickname,p.RoomTitle});
        // modelBuilder.Entity<Player>().HasIndex(p => p.CreatedTime);
    }
}