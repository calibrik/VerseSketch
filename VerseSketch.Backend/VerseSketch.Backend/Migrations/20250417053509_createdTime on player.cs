using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VerseSketch.Backend.Migrations
{
    /// <inheritdoc />
    public partial class createdTimeonplayer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedTime",
                table: "Players",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_Players_CreatedTime",
                table: "Players",
                column: "CreatedTime");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Players_CreatedTime",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "CreatedTime",
                table: "Players");
        }
    }
}
