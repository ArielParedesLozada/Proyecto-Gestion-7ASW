using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class Renovacione : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "RenovacionId",
                table: "notificaciones",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_notificaciones_RenovacionId",
                table: "notificaciones",
                column: "RenovacionId");

            migrationBuilder.AddForeignKey(
                name: "FK_notificaciones_renovaciones_RenovacionId",
                table: "notificaciones",
                column: "RenovacionId",
                principalTable: "renovaciones",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_notificaciones_renovaciones_RenovacionId",
                table: "notificaciones");

            migrationBuilder.DropIndex(
                name: "IX_notificaciones_RenovacionId",
                table: "notificaciones");

            migrationBuilder.DropColumn(
                name: "RenovacionId",
                table: "notificaciones");
        }
    }
}
