using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class CambioPolizas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Crear tabla aseguradoras
            migrationBuilder.CreateTable(
                name: "aseguradoras",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_aseguradoras", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_aseguradoras_Email",
                table: "aseguradoras",
                column: "Email",
                unique: true);

            // 2. Agregar columna nullable
            migrationBuilder.AddColumn<Guid>(
                name: "AseguradoraId",
                table: "polizas",
                type: "uuid",
                nullable: true);

            // 3. Migrar datos (IMPORTANTE 🔥)
            migrationBuilder.Sql(@"
        INSERT INTO aseguradoras (""Id"", ""Nombre"", ""Email"")
        SELECT gen_random_uuid(), p.""Aseguradora"", p.""Aseguradora"" || '@temp.com'
        FROM polizas p
        GROUP BY p.""Aseguradora"";
    ");

            migrationBuilder.Sql(@"
        UPDATE polizas p
        SET ""AseguradoraId"" = a.""Id""
        FROM aseguradoras a
        WHERE p.""Aseguradora"" = a.""Nombre"";
    ");

            // 4. Hacer NOT NULL
            migrationBuilder.AlterColumn<Guid>(
                name: "AseguradoraId",
                table: "polizas",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldNullable: true);

            // 5. Crear índice + FK
            migrationBuilder.CreateIndex(
                name: "IX_polizas_AseguradoraId",
                table: "polizas",
                column: "AseguradoraId");

            migrationBuilder.AddForeignKey(
                name: "FK_polizas_aseguradoras_AseguradoraId",
                table: "polizas",
                column: "AseguradoraId",
                principalTable: "aseguradoras",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // 6. Eliminar columna antigua
            migrationBuilder.DropColumn(
                name: "Aseguradora",
                table: "polizas");

            // Otros cambios que ya tenías
            migrationBuilder.DropIndex(
                name: "IX_empresas_Email",
                table: "empresas");

            migrationBuilder.DropColumn(
                name: "PeriodicidadRenovacion",
                table: "ramos");

            migrationBuilder.AddColumn<TimeSpan>(
                name: "PeriodicidadRenovacion",
                table: "polizas",
                type: "interval",
                nullable: false,
                defaultValue: TimeSpan.Zero);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_polizas_aseguradoras_AseguradoraId",
                table: "polizas");

            migrationBuilder.DropTable(
                name: "aseguradoras");

            migrationBuilder.DropIndex(
                name: "IX_polizas_AseguradoraId",
                table: "polizas");

            migrationBuilder.DropColumn(
                name: "AseguradoraId",
                table: "polizas");

            migrationBuilder.DropColumn(
                name: "PeriodicidadRenovacion",
                table: "polizas");

            migrationBuilder.AddColumn<TimeSpan>(
                name: "PeriodicidadRenovacion",
                table: "ramos",
                type: "interval",
                nullable: false,
                defaultValue: new TimeSpan(0, 0, 0, 0, 0));

            migrationBuilder.AddColumn<string>(
                name: "Aseguradora",
                table: "polizas",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_empresas_Email",
                table: "empresas",
                column: "Email",
                unique: true);
        }
    }
}
