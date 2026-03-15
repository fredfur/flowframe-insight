using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlowVision.API.Migrations
{
    /// <inheritdoc />
    public partial class AddBottleneckToEquipment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_bottleneck",
                table: "equipments",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_bottleneck",
                table: "equipments");
        }
    }
}
