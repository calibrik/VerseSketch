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
        
    }
}