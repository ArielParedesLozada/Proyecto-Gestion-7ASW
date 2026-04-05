using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class PolizasMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "empresas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_empresas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ramos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "text", nullable: false),
                    CambiaValor = table.Column<bool>(type: "boolean", nullable: false),
                    Descripcion = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ramos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "polizas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Numero = table.Column<string>(type: "text", nullable: false),
                    Contratista = table.Column<Guid>(type: "uuid", nullable: false),
                    Obra = table.Column<string>(type: "text", nullable: false),
                    Ramo = table.Column<Guid>(type: "uuid", nullable: false),
                    Aseguradora = table.Column<string>(type: "text", nullable: false),
                    FechaEmision = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    FechaExpiracion = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ValorOriginal = table.Column<decimal>(type: "numeric", nullable: false),
                    ValorActual = table.Column<decimal>(type: "numeric", nullable: false),
                    Estado = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    DeletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_polizas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_polizas_empresas_Contratista",
                        column: x => x.Contratista,
                        principalTable: "empresas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_polizas_ramos_Ramo",
                        column: x => x.Ramo,
                        principalTable: "ramos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_empresas_Email",
                table: "empresas",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_empresas_Id",
                table: "empresas",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_polizas_Contratista",
                table: "polizas",
                column: "Contratista");

            migrationBuilder.CreateIndex(
                name: "IX_polizas_Id",
                table: "polizas",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_polizas_Numero",
                table: "polizas",
                column: "Numero",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_polizas_Ramo",
                table: "polizas",
                column: "Ramo");

            migrationBuilder.CreateIndex(
                name: "IX_ramos_Id",
                table: "ramos",
                column: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "polizas");

            migrationBuilder.DropTable(
                name: "empresas");

            migrationBuilder.DropTable(
                name: "ramos");
        }
    }
}
