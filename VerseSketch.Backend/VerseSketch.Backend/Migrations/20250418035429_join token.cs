using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VerseSketch.Backend.Migrations
{
    /// <inheritdoc />
    public partial class jointoken : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CurrentJoinToken",
                table: "Rooms",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CurrentJoinToken",
                table: "Rooms");
        }
    }
}
