using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class PolizasNumeroObraUnique : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_polizas_Numero",
                table: "polizas");

            migrationBuilder.CreateIndex(
                name: "IX_polizas_Numero_Obra",
                table: "polizas",
                columns: new[] { "Numero", "Obra" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_polizas_Numero_Obra",
                table: "polizas");

            migrationBuilder.CreateIndex(
                name: "IX_polizas_Numero",
                table: "polizas",
                column: "Numero",
                unique: true);
        }
    }
}
