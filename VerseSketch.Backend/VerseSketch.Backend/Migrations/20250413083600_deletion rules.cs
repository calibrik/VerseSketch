using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VerseSketch.Backend.Migrations
{
    /// <inheritdoc />
    public partial class deletionrules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Players_Rooms_RoomTitle",
                table: "Players");

            migrationBuilder.AddForeignKey(
                name: "FK_Players_Rooms_RoomTitle",
                table: "Players",
                column: "RoomTitle",
                principalTable: "Rooms",
                principalColumn: "Title",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Players_Rooms_RoomTitle",
                table: "Players");

            migrationBuilder.AddForeignKey(
                name: "FK_Players_Rooms_RoomTitle",
                table: "Players",
                column: "RoomTitle",
                principalTable: "Rooms",
                principalColumn: "Title");
        }
    }
}
