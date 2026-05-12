using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class RenovacionesMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<TimeSpan>(
                name: "PeriodicidadRenovacion",
                table: "ramos",
                type: "interval",
                nullable: false,
                defaultValue: new TimeSpan(0, 0, 0, 0, 0));

            migrationBuilder.CreateTable(
                name: "auditorias",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Tabla = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    RegistroId = table.Column<Guid>(type: "uuid", nullable: false),
                    Accion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DatosPrevios = table.Column<string>(type: "text", nullable: false),
                    DatosNuevos = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_auditorias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_auditorias_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "notificaciones",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PolizaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Estado = table.Column<string>(type: "text", nullable: false),
                    Tipo = table.Column<string>(type: "text", nullable: false),
                    FechaEnvio = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notificaciones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_notificaciones_polizas_PolizaId",
                        column: x => x.PolizaId,
                        principalTable: "polizas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "renovaciones",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PolizaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Estado = table.Column<int>(type: "integer", nullable: false),
                    Valor = table.Column<decimal>(type: "numeric", nullable: false),
                    FechaRenovacion = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    FechaExpiracion = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Observaciones = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_renovaciones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_renovaciones_polizas_PolizaId",
                        column: x => x.PolizaId,
                        principalTable: "polizas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_auditorias_Id",
                table: "auditorias",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_auditorias_UserId",
                table: "auditorias",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_notificaciones_Id",
                table: "notificaciones",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_notificaciones_PolizaId",
                table: "notificaciones",
                column: "PolizaId");

            migrationBuilder.CreateIndex(
                name: "IX_renovaciones_Id",
                table: "renovaciones",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_renovaciones_PolizaId",
                table: "renovaciones",
                column: "PolizaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "auditorias");

            migrationBuilder.DropTable(
                name: "notificaciones");

            migrationBuilder.DropTable(
                name: "renovaciones");

            migrationBuilder.DropColumn(
                name: "PeriodicidadRenovacion",
                table: "ramos");
        }
    }
}
