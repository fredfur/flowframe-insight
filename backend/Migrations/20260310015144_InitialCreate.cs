using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FlowVision.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "sites",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Location = table.Column<string>(type: "text", nullable: false),
                    Timezone = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sites", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "system_logs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    level = table.Column<string>(type: "text", nullable: false),
                    source = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    message = table.Column<string>(type: "text", nullable: false),
                    stack_trace = table.Column<string>(type: "text", nullable: true),
                    metadata = table.Column<string>(type: "text", nullable: true),
                    timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_system_logs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "app_users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    email = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    password_hash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    role = table.Column<string>(type: "text", nullable: false),
                    site_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    last_login_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_app_users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_app_users_sites_site_id",
                        column: x => x.site_id,
                        principalTable: "sites",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "stop_category_configs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    site_id = table.Column<Guid>(type: "uuid", nullable: false),
                    category = table.Column<string>(type: "text", nullable: false),
                    label = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    color = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stop_category_configs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_stop_category_configs_sites_site_id",
                        column: x => x.site_id,
                        principalTable: "sites",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "device_logs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    device_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    device_type = table.Column<string>(type: "text", nullable: false),
                    event_type = table.Column<string>(type: "text", nullable: false),
                    latency_ms = table.Column<int>(type: "integer", nullable: true),
                    fps = table.Column<int>(type: "integer", nullable: true),
                    memory_usage_percent = table.Column<int>(type: "integer", nullable: true),
                    firmware_version = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    detail = table.Column<string>(type: "text", nullable: true),
                    raw_payload = table.Column<string>(type: "text", nullable: true),
                    equipment_id = table.Column<Guid>(type: "uuid", nullable: true),
                    line_id = table.Column<Guid>(type: "uuid", nullable: true),
                    timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_device_logs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "equipments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    line_id = table.Column<Guid>(type: "uuid", nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false),
                    nominal_speed = table.Column<int>(type: "integer", nullable: false),
                    x = table.Column<double>(type: "double precision", nullable: false),
                    y = table.Column<double>(type: "double precision", nullable: false),
                    gateway_device_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    camera_device_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_equipments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "machine_telemetry",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    equipment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    throughput = table.Column<int>(type: "integer", nullable: false),
                    availability = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    performance = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    quality = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    oee = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    raw_payload = table.Column<string>(type: "text", nullable: true),
                    timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_machine_telemetry", x => x.Id);
                    table.ForeignKey(
                        name: "FK_machine_telemetry_equipments_equipment_id",
                        column: x => x.equipment_id,
                        principalTable: "equipments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "operator_assignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    equipment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    assigned_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    unassigned_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_operator_assignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_operator_assignments_app_users_user_id",
                        column: x => x.user_id,
                        principalTable: "app_users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_operator_assignments_equipments_equipment_id",
                        column: x => x.equipment_id,
                        principalTable: "equipments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "error_signals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    source = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    message = table.Column<string>(type: "text", nullable: false),
                    severity = table.Column<string>(type: "text", nullable: false),
                    is_resolved = table.Column<bool>(type: "boolean", nullable: false),
                    resolved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    resolved_by = table.Column<string>(type: "text", nullable: true),
                    resolution_notes = table.Column<string>(type: "text", nullable: true),
                    equipment_id = table.Column<Guid>(type: "uuid", nullable: true),
                    line_id = table.Column<Guid>(type: "uuid", nullable: true),
                    raw_payload = table.Column<string>(type: "text", nullable: true),
                    timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_error_signals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_error_signals_equipments_equipment_id",
                        column: x => x.equipment_id,
                        principalTable: "equipments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "flow_equipments",
                columns: table => new
                {
                    flow_id = table.Column<Guid>(type: "uuid", nullable: false),
                    equipment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    override_nominal_speed = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_flow_equipments", x => new { x.flow_id, x.equipment_id });
                    table.ForeignKey(
                        name: "FK_flow_equipments_equipments_equipment_id",
                        column: x => x.equipment_id,
                        principalTable: "equipments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "hourly_productions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    order_id = table.Column<Guid>(type: "uuid", nullable: false),
                    line_id = table.Column<Guid>(type: "uuid", nullable: false),
                    hour_start = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    planned_quantity = table.Column<int>(type: "integer", nullable: false),
                    actual_quantity = table.Column<int>(type: "integer", nullable: false),
                    rejected_quantity = table.Column<int>(type: "integer", nullable: false),
                    @operator = table.Column<string>(name: "operator", type: "character varying(200)", maxLength: 200, nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_hourly_productions", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "production_flows",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    sku = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    line_id = table.Column<Guid>(type: "uuid", nullable: false),
                    nominal_speed = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_production_flows", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "production_lines",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    site_id = table.Column<Guid>(type: "uuid", nullable: false),
                    nominal_speed = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    active_flow_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_production_lines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_production_lines_production_flows_active_flow_id",
                        column: x => x.active_flow_id,
                        principalTable: "production_flows",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_production_lines_sites_site_id",
                        column: x => x.site_id,
                        principalTable: "sites",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "production_orders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    order_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    flow_id = table.Column<Guid>(type: "uuid", nullable: false),
                    line_id = table.Column<Guid>(type: "uuid", nullable: false),
                    target_quantity = table.Column<int>(type: "integer", nullable: false),
                    produced_quantity = table.Column<int>(type: "integer", nullable: false),
                    rejected_quantity = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    planned_start = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    planned_end = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    actual_start = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    actual_end = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_production_orders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_production_orders_production_flows_flow_id",
                        column: x => x.flow_id,
                        principalTable: "production_flows",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_production_orders_production_lines_line_id",
                        column: x => x.line_id,
                        principalTable: "production_lines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "shifts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    site_id = table.Column<Guid>(type: "uuid", nullable: false),
                    line_id = table.Column<Guid>(type: "uuid", nullable: true),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    start_time = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    end_time = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    crosses_midnight = table.Column<bool>(type: "boolean", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_shifts", x => x.id);
                    table.ForeignKey(
                        name: "FK_shifts_production_lines_line_id",
                        column: x => x.line_id,
                        principalTable: "production_lines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_shifts_sites_site_id",
                        column: x => x.site_id,
                        principalTable: "sites",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "transports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    line_id = table.Column<Guid>(type: "uuid", nullable: false),
                    from_position = table.Column<int>(type: "integer", nullable: false),
                    to_position = table.Column<int>(type: "integer", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    capacity = table.Column<int>(type: "integer", nullable: false),
                    sensor_device_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_transports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_transports_production_lines_line_id",
                        column: x => x.line_id,
                        principalTable: "production_lines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "shift_operators",
                columns: table => new
                {
                    shift_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    assigned_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_shift_operators", x => new { x.shift_id, x.user_id });
                    table.ForeignKey(
                        name: "FK_shift_operators_app_users_user_id",
                        column: x => x.user_id,
                        principalTable: "app_users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_shift_operators_shifts_shift_id",
                        column: x => x.shift_id,
                        principalTable: "shifts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "stops",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    equipment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    machine_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    line_id = table.Column<Guid>(type: "uuid", nullable: false),
                    category = table.Column<string>(type: "text", nullable: false),
                    start_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    end_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    duration_minutes = table.Column<int>(type: "integer", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    registered_by = table.Column<string>(type: "text", nullable: false),
                    production_order_id = table.Column<Guid>(type: "uuid", nullable: true),
                    shift_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_auto_detected = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stops", x => x.Id);
                    table.ForeignKey(
                        name: "FK_stops_equipments_equipment_id",
                        column: x => x.equipment_id,
                        principalTable: "equipments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_stops_production_lines_line_id",
                        column: x => x.line_id,
                        principalTable: "production_lines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_stops_production_orders_production_order_id",
                        column: x => x.production_order_id,
                        principalTable: "production_orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_stops_shifts_shift_id",
                        column: x => x.shift_id,
                        principalTable: "shifts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "transport_telemetry",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    transport_id = table.Column<Guid>(type: "uuid", nullable: false),
                    accumulation_level = table.Column<string>(type: "text", nullable: false),
                    accumulation_percent = table.Column<int>(type: "integer", nullable: false),
                    current_units = table.Column<int>(type: "integer", nullable: false),
                    raw_payload = table.Column<string>(type: "text", nullable: true),
                    timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_transport_telemetry", x => x.Id);
                    table.ForeignKey(
                        name: "FK_transport_telemetry_transports_transport_id",
                        column: x => x.transport_id,
                        principalTable: "transports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_app_users_site_id",
                table: "app_users",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "IX_device_logs_device_id_timestamp",
                table: "device_logs",
                columns: new[] { "device_id", "timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_device_logs_equipment_id",
                table: "device_logs",
                column: "equipment_id");

            migrationBuilder.CreateIndex(
                name: "IX_device_logs_line_id",
                table: "device_logs",
                column: "line_id");

            migrationBuilder.CreateIndex(
                name: "IX_device_logs_timestamp",
                table: "device_logs",
                column: "timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_equipments_line_id",
                table: "equipments",
                column: "line_id");

            migrationBuilder.CreateIndex(
                name: "IX_error_signals_equipment_id",
                table: "error_signals",
                column: "equipment_id");

            migrationBuilder.CreateIndex(
                name: "IX_error_signals_is_resolved_severity_timestamp",
                table: "error_signals",
                columns: new[] { "is_resolved", "severity", "timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_error_signals_line_id",
                table: "error_signals",
                column: "line_id");

            migrationBuilder.CreateIndex(
                name: "IX_flow_equipments_equipment_id",
                table: "flow_equipments",
                column: "equipment_id");

            migrationBuilder.CreateIndex(
                name: "IX_hourly_productions_line_id",
                table: "hourly_productions",
                column: "line_id");

            migrationBuilder.CreateIndex(
                name: "IX_hourly_productions_order_id",
                table: "hourly_productions",
                column: "order_id");

            migrationBuilder.CreateIndex(
                name: "IX_machine_telemetry_equipment_id_timestamp",
                table: "machine_telemetry",
                columns: new[] { "equipment_id", "timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_operator_assignments_equipment_id",
                table: "operator_assignments",
                column: "equipment_id");

            migrationBuilder.CreateIndex(
                name: "IX_operator_assignments_user_id",
                table: "operator_assignments",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_production_flows_line_id",
                table: "production_flows",
                column: "line_id");

            migrationBuilder.CreateIndex(
                name: "IX_production_lines_active_flow_id",
                table: "production_lines",
                column: "active_flow_id");

            migrationBuilder.CreateIndex(
                name: "IX_production_lines_site_id",
                table: "production_lines",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "IX_production_orders_flow_id",
                table: "production_orders",
                column: "flow_id");

            migrationBuilder.CreateIndex(
                name: "IX_production_orders_line_id",
                table: "production_orders",
                column: "line_id");

            migrationBuilder.CreateIndex(
                name: "IX_shift_operators_user_id",
                table: "shift_operators",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_shifts_line_id",
                table: "shifts",
                column: "line_id");

            migrationBuilder.CreateIndex(
                name: "IX_shifts_site_id",
                table: "shifts",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "IX_stop_category_configs_site_id_category",
                table: "stop_category_configs",
                columns: new[] { "site_id", "category" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_stops_equipment_id",
                table: "stops",
                column: "equipment_id");

            migrationBuilder.CreateIndex(
                name: "IX_stops_line_id",
                table: "stops",
                column: "line_id");

            migrationBuilder.CreateIndex(
                name: "IX_stops_production_order_id",
                table: "stops",
                column: "production_order_id");

            migrationBuilder.CreateIndex(
                name: "IX_stops_shift_id",
                table: "stops",
                column: "shift_id");

            migrationBuilder.CreateIndex(
                name: "IX_system_logs_level_timestamp",
                table: "system_logs",
                columns: new[] { "level", "timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_system_logs_timestamp",
                table: "system_logs",
                column: "timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_transport_telemetry_transport_id_timestamp",
                table: "transport_telemetry",
                columns: new[] { "transport_id", "timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_transports_line_id",
                table: "transports",
                column: "line_id");

            migrationBuilder.AddForeignKey(
                name: "FK_device_logs_equipments_equipment_id",
                table: "device_logs",
                column: "equipment_id",
                principalTable: "equipments",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_device_logs_production_lines_line_id",
                table: "device_logs",
                column: "line_id",
                principalTable: "production_lines",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_equipments_production_lines_line_id",
                table: "equipments",
                column: "line_id",
                principalTable: "production_lines",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_error_signals_production_lines_line_id",
                table: "error_signals",
                column: "line_id",
                principalTable: "production_lines",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_flow_equipments_production_flows_flow_id",
                table: "flow_equipments",
                column: "flow_id",
                principalTable: "production_flows",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_hourly_productions_production_lines_line_id",
                table: "hourly_productions",
                column: "line_id",
                principalTable: "production_lines",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_hourly_productions_production_orders_order_id",
                table: "hourly_productions",
                column: "order_id",
                principalTable: "production_orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_production_flows_production_lines_line_id",
                table: "production_flows",
                column: "line_id",
                principalTable: "production_lines",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_production_lines_sites_site_id",
                table: "production_lines");

            migrationBuilder.DropForeignKey(
                name: "FK_production_flows_production_lines_line_id",
                table: "production_flows");

            migrationBuilder.DropTable(
                name: "device_logs");

            migrationBuilder.DropTable(
                name: "error_signals");

            migrationBuilder.DropTable(
                name: "flow_equipments");

            migrationBuilder.DropTable(
                name: "hourly_productions");

            migrationBuilder.DropTable(
                name: "machine_telemetry");

            migrationBuilder.DropTable(
                name: "operator_assignments");

            migrationBuilder.DropTable(
                name: "shift_operators");

            migrationBuilder.DropTable(
                name: "stop_category_configs");

            migrationBuilder.DropTable(
                name: "stops");

            migrationBuilder.DropTable(
                name: "system_logs");

            migrationBuilder.DropTable(
                name: "transport_telemetry");

            migrationBuilder.DropTable(
                name: "app_users");

            migrationBuilder.DropTable(
                name: "equipments");

            migrationBuilder.DropTable(
                name: "production_orders");

            migrationBuilder.DropTable(
                name: "shifts");

            migrationBuilder.DropTable(
                name: "transports");

            migrationBuilder.DropTable(
                name: "sites");

            migrationBuilder.DropTable(
                name: "production_lines");

            migrationBuilder.DropTable(
                name: "production_flows");
        }
    }
}
