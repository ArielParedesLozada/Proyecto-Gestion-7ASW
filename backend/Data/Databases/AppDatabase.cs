using Backend.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data.Databases;

public class AppDatabase : DbContext
{
    public AppDatabase(DbContextOptions<AppDatabase> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Id);
            entity.HasIndex(u => u.Username).IsUnique();
        });
    }
}