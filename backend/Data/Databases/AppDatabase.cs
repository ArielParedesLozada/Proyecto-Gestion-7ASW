using Backend.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data.Databases;

public class AppDatabase : DbContext
{
    public AppDatabase(DbContextOptions<AppDatabase> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Empresa> Empresas { get; set; }
    public DbSet<Ramo> Ramos { get; set; }
    public DbSet<Poliza> Polizas { get; set; }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Id);
            entity.HasIndex(u => u.Username).IsUnique();
            entity.HasIndex(u => u.Email).IsUnique();
        });
        modelBuilder.Entity<PasswordReset>(entity =>
        {
            entity.ToTable("password-reset-tokens");
            entity.HasKey(t => t.Id);
            entity.HasOne<User>()
                 .WithMany()
                 .HasForeignKey(t => t.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<Ramo>(entity =>
        {
            entity.ToTable("ramos");
            entity.HasKey(r => r.Id);
            entity.HasIndex(r => r.Id);
        });
        modelBuilder.Entity<Empresa>(entity =>
        {
            entity.ToTable("empresas");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
        });
        modelBuilder.Entity<Poliza>(entity =>
        {
            entity.ToTable("polizas");
            entity.HasKey(p => p.Id);
            entity.HasIndex(p => p.Id);
            entity.HasIndex(p => new { p.Numero, p.Obra }).IsUnique();
            entity.HasQueryFilter(p => p.DeletedAt == null);
            entity.HasOne<Empresa>(p => p.ContratistaNav)
                .WithMany()
                .HasForeignKey(p => p.Contratista)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<Ramo>(p => p.RamoNav)
                .WithMany()
                .HasForeignKey(p => p.Ramo)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
