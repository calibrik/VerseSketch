using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VerseSketch.Backend.Migrations
{
    /// <inheritdoc />
    public partial class indexonplayers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Players_Rooms_RoomTitle",
                table: "Players");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_Players_Nickname_RoomTitle",
                table: "Players");

            migrationBuilder.AlterColumn<string>(
                name: "RoomTitle",
                table: "Players",
                type: "character varying(40)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(40)");

            migrationBuilder.AlterColumn<string>(
                name: "Nickname",
                table: "Players",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30);

            migrationBuilder.CreateIndex(
                name: "IX_Players_Nickname_RoomTitle",
                table: "Players",
                columns: new[] { "Nickname", "RoomTitle" });

            migrationBuilder.AddForeignKey(
                name: "FK_Players_Rooms_RoomTitle",
                table: "Players",
                column: "RoomTitle",
                principalTable: "Rooms",
                principalColumn: "Title");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Players_Rooms_RoomTitle",
                table: "Players");

            migrationBuilder.DropIndex(
                name: "IX_Players_Nickname_RoomTitle",
                table: "Players");

            migrationBuilder.AlterColumn<string>(
                name: "RoomTitle",
                table: "Players",
                type: "character varying(40)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(40)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Nickname",
                table: "Players",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30,
                oldNullable: true);

            migrationBuilder.AddUniqueConstraint(
                name: "AK_Players_Nickname_RoomTitle",
                table: "Players",
                columns: new[] { "Nickname", "RoomTitle" });

            migrationBuilder.AddForeignKey(
                name: "FK_Players_Rooms_RoomTitle",
                table: "Players",
                column: "RoomTitle",
                principalTable: "Rooms",
                principalColumn: "Title",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
