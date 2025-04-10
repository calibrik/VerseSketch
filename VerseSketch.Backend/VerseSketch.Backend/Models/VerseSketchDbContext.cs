﻿using Microsoft.EntityFrameworkCore;

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
        modelBuilder.Entity<Room>().HasMany(r => r.Players).WithOne(p => p.Room).HasForeignKey(p => p.RoomTitle);
        modelBuilder.Entity<Room>().HasOne(p => p.Admin).WithMany().HasForeignKey(r => r.AdminId);
        modelBuilder.Entity<Room>().HasKey(r => r.Title);
        modelBuilder.Entity<Room>().Property(r => r.Title).HasMaxLength(40);
        modelBuilder.Entity<Player>().Property(p => p.Nickname).HasMaxLength(30);
        modelBuilder.Entity<Player>().HasIndex(p => p.Nickname);
    }
}