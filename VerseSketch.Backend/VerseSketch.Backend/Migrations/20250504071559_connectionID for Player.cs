using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VerseSketch.Backend.Migrations
{
    /// <inheritdoc />
    public partial class connectionIDforPlayer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ConnectionID",
                table: "Players",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConnectionID",
                table: "Players");
        }
    }
}
