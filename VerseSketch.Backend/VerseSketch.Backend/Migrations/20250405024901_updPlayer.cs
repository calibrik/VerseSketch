using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VerseSketch.Backend.Migrations
{
    /// <inheritdoc />
    public partial class updPlayer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Players_Rooms_RoomId",
                table: "Players");

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "Rooms",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "RoomName",
                table: "Players",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Nickname",
                table: "Players",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.CreateIndex(
                name: "IX_Rooms_Title",
                table: "Rooms",
                column: "Title",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Players_Rooms_RoomId",
                table: "Players",
                column: "RoomName",
                principalTable: "Rooms",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Players_Rooms_RoomId",
                table: "Players");

            migrationBuilder.DropIndex(
                name: "IX_Rooms_Title",
                table: "Rooms");

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "Rooms",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(40)",
                oldMaxLength: 40);

            migrationBuilder.AlterColumn<string>(
                name: "RoomName",
                table: "Players",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Nickname",
                table: "Players",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30,
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Players_Rooms_RoomId",
                table: "Players",
                column: "RoomName",
                principalTable: "Rooms",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
