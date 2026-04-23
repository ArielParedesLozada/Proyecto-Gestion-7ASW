using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class RenovacionesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_notificaciones_polizas_Poliza",
                table: "notificaciones");

            migrationBuilder.RenameColumn(
                name: "Poliza",
                table: "notificaciones",
                newName: "PolizaId");

            migrationBuilder.RenameIndex(
                name: "IX_notificaciones_Poliza",
                table: "notificaciones",
                newName: "IX_notificaciones_PolizaId");

            migrationBuilder.AddForeignKey(
                name: "FK_notificaciones_polizas_PolizaId",
                table: "notificaciones",
                column: "PolizaId",
                principalTable: "polizas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_notificaciones_polizas_PolizaId",
                table: "notificaciones");

            migrationBuilder.RenameColumn(
                name: "PolizaId",
                table: "notificaciones",
                newName: "Poliza");

            migrationBuilder.RenameIndex(
                name: "IX_notificaciones_PolizaId",
                table: "notificaciones",
                newName: "IX_notificaciones_Poliza");

            migrationBuilder.AddForeignKey(
                name: "FK_notificaciones_polizas_Poliza",
                table: "notificaciones",
                column: "Poliza",
                principalTable: "polizas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
