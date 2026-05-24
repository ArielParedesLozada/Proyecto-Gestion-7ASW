using Backend.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data.Databases;

public class AppDatabase : DbContext
{
    public AppDatabase(DbContextOptions<AppDatabase> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Empresa> Empresas { get; set; }
    public DbSet<Aseguradora> Aseguradoras { get; set; }
    public DbSet<Ramo> Ramos { get; set; }
    public DbSet<Poliza> Polizas { get; set; }
    public DbSet<Renovacion> Renovaciones { get; set; }
    public DbSet<Notificacion> Notificaciones { get; set; }
    public DbSet<Auditoria> Auditorias { get; set; }
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
        modelBuilder.Entity<Aseguradora>(entity =>
        {
            entity.ToTable("aseguradoras");
            entity.HasKey(a => a.Id);
            entity.HasIndex(a => a.Email).IsUnique();
        });
        modelBuilder.Entity<Empresa>(entity =>
        {
            entity.ToTable("empresas");
            entity.HasKey(e => e.Id);
        });
        modelBuilder.Entity<Poliza>(entity =>
        {
            entity.ToTable("polizas");
            entity.HasKey(p => p.Id);
            entity.HasIndex(p => p.Id);
            // Por que no solo p.Numero
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
            entity.HasOne<User>(p => p.UsuarioNav)
                .WithMany()
                .HasForeignKey(p => p.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.Property(p => p.PeriodicidadRenovacion)
                .HasColumnType("interval");
            entity.HasOne<Aseguradora>(p => p.AseguradoraNav)
                .WithMany()
                .HasForeignKey(p => p.AseguradoraId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<Renovacion>(entity =>
        {
            entity.ToTable("renovaciones");
            entity.HasKey(r => r.Id);
            entity.HasIndex(r => r.Id);
            entity.HasOne<Poliza>(r => r.PolizaNav)
                .WithMany()
                .HasForeignKey(r => r.PolizaId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasQueryFilter(r => r.PolizaNav.DeletedAt == null);
        });
        modelBuilder.Entity<Notificacion>(entity =>
        {
            entity.ToTable("notificaciones");
            entity.HasKey(n => n.Id);

            entity.HasIndex(n => n.Id);
            entity.Property(n => n.Estado)
                .HasConversion<string>();
            entity.Property(n => n.Tipo)
                .HasConversion<string>();
            entity.HasOne(n => n.PolizaNav)
                .WithMany()
                .HasForeignKey(n => n.PolizaId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(n => n.RenovacionNav)
                .WithMany()
                .HasForeignKey(n => n.RenovacionId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasQueryFilter(n => n.PolizaNav.DeletedAt == null);
        });
        modelBuilder.Entity<Auditoria>(entity =>
        {
            entity.ToTable("auditorias");
            entity.HasKey(a => a.Id);
            entity.HasIndex(a => a.Id);
            entity.HasIndex(a => a.UserId);
            entity.Property(a => a.Tabla)
                .HasMaxLength(100);
            entity.Property(a => a.Accion)
                .HasMaxLength(50);
            entity.Property(a => a.DatosPrevios)
                .HasColumnType("text");
            entity.Property(a => a.DatosNuevos)
                .HasColumnType("text");
            entity.HasOne(a => a.UsuarioNav)
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Restrict); // importante para preservar auditoria
        });
    }
}

