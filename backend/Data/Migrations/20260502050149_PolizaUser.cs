using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class PolizaUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Agregar columna NULLABLE
            migrationBuilder.AddColumn<Guid>(
                name: "UsuarioId",
                table: "polizas",
                type: "uuid",
                nullable: true);

            // 2. Poblar: preferir adminpapu (seed); si no existe aún, cualquier usuario.
            //    El seed corre después de Migrate en Program.cs, así que no exigir adminpapu aquí.
            migrationBuilder.Sql(@"
        UPDATE polizas
        SET ""UsuarioId"" = COALESCE(
            (SELECT ""Id"" FROM users WHERE ""Username"" = 'adminpapu' LIMIT 1),
            (SELECT ""Id"" FROM users ORDER BY ""Id"" LIMIT 1)
        )
        WHERE ""UsuarioId"" IS NULL;
    ");

            migrationBuilder.Sql(@"
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM polizas LIMIT 1)
               AND NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
                RAISE EXCEPTION 'Hay pólizas pero no hay usuarios; no se puede asignar UsuarioId.';
            END IF;
        END
        $$;
    ");

            // 3. Hacer NOT NULL
            migrationBuilder.AlterColumn<Guid>(
                name: "UsuarioId",
                table: "polizas",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldNullable: true);

            // 4. Índice
            migrationBuilder.CreateIndex(
                name: "IX_polizas_UsuarioId",
                table: "polizas",
                column: "UsuarioId");

            // 5. FK
            migrationBuilder.AddForeignKey(
                name: "FK_polizas_users_UsuarioId",
                table: "polizas",
                column: "UsuarioId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_polizas_users_UsuarioId",
                table: "polizas");

            migrationBuilder.DropIndex(
                name: "IX_polizas_UsuarioId",
                table: "polizas");

            migrationBuilder.DropColumn(
                name: "UsuarioId",
                table: "polizas");
        }
    }
}
