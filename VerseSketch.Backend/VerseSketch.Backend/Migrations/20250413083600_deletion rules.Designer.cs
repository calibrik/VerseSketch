﻿// <auto-generated />
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using VerseSketch.Backend.Models;

#nullable disable

namespace VerseSketch.Backend.Migrations
{
    [DbContext(typeof(VerseSketchDbContext))]
    [Migration("20250413083600_deletion rules")]
    partial class deletionrules
    {
        /// <inheritdoc />
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "9.0.3")
                .HasAnnotation("Relational:MaxIdentifierLength", 63);

            NpgsqlModelBuilderExtensions.UseIdentityByDefaultColumns(modelBuilder);

            modelBuilder.Entity("VerseSketch.Backend.Models.Player", b =>
                {
                    b.Property<string>("Id")
                        .HasColumnType("text");

                    b.Property<string>("Nickname")
                        .HasMaxLength(30)
                        .HasColumnType("character varying(30)");

                    b.Property<string>("RoomTitle")
                        .HasColumnType("character varying(40)");

                    b.HasKey("Id");

                    b.HasIndex("RoomTitle");

                    b.HasIndex("Nickname", "RoomTitle");

                    b.ToTable("Players");
                });

            modelBuilder.Entity("VerseSketch.Backend.Models.Room", b =>
                {
                    b.Property<string>("Title")
                        .HasMaxLength(40)
                        .HasColumnType("character varying(40)");

                    b.Property<string>("AdminId")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<int>("MaxPlayersCount")
                        .HasColumnType("integer");

                    b.Property<int>("PlayersCount")
                        .HasColumnType("integer");

                    b.Property<int>("TimeToDraw")
                        .HasColumnType("integer");

                    b.Property<bool>("isPublic")
                        .HasColumnType("boolean");

                    b.HasKey("Title");

                    b.HasIndex("AdminId");

                    b.ToTable("Rooms");
                });

            modelBuilder.Entity("VerseSketch.Backend.Models.Player", b =>
                {
                    b.HasOne("VerseSketch.Backend.Models.Room", "Room")
                        .WithMany("Players")
                        .HasForeignKey("RoomTitle")
                        .OnDelete(DeleteBehavior.Cascade);

                    b.Navigation("Room");
                });

            modelBuilder.Entity("VerseSketch.Backend.Models.Room", b =>
                {
                    b.HasOne("VerseSketch.Backend.Models.Player", "Admin")
                        .WithMany()
                        .HasForeignKey("AdminId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Admin");
                });

            modelBuilder.Entity("VerseSketch.Backend.Models.Room", b =>
                {
                    b.Navigation("Players");
                });
#pragma warning restore 612, 618
        }
    }
}
