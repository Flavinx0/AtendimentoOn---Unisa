using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AtendimentoOn.Infrastructure.Persistencia.Migracoes
{
    /// <inheritdoc />
    public partial class SenhasERecuperacao : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "PrecisaTrocarSenha",
                table: "Usuarios",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "CodigosDeRecuperacao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CodigoHash = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiraEm = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TentativasErradas = table.Column<int>(type: "int", nullable: false),
                    UsadoEm = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CodigosDeRecuperacao", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CodigosDeRecuperacao_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: new Guid("2ce77f75-f668-4d91-a8fa-80286026ec0c"),
                column: "PrecisaTrocarSenha",
                value: false);

            migrationBuilder.CreateIndex(
                name: "IX_CodigosDeRecuperacao_UsuarioId_CriadoEm",
                table: "CodigosDeRecuperacao",
                columns: new[] { "UsuarioId", "CriadoEm" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CodigosDeRecuperacao");

            migrationBuilder.DropColumn(
                name: "PrecisaTrocarSenha",
                table: "Usuarios");
        }
    }
}
