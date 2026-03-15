using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlowVision.API.Migrations
{
    /// <inheritdoc />
    public partial class AddDevicesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "devices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    external_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    line_id = table.Column<Guid>(type: "uuid", nullable: false),
                    measures_output_of_equipment_id = table.Column<Guid>(type: "uuid", nullable: true),
                    measures_input_of_equipment_id = table.Column<Guid>(type: "uuid", nullable: true),
                    stream_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    last_seen = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_devices", x => x.Id);
                    table.ForeignKey(name: "FK_devices_lines", column: x => x.line_id, principalTable: "production_lines", principalColumn: "Id", onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(name: "FK_devices_output_equipment", column: x => x.measures_output_of_equipment_id, principalTable: "equipments", principalColumn: "Id", onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(name: "FK_devices_input_equipment", column: x => x.measures_input_of_equipment_id, principalTable: "equipments", principalColumn: "Id", onDelete: ReferentialAction.SetNull);
                });
            migrationBuilder.CreateIndex(name: "IX_devices_external_id", table: "devices", column: "external_id", unique: true);
            migrationBuilder.CreateIndex(name: "IX_devices_line_id", table: "devices", column: "line_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "devices");
        }
    }
}
