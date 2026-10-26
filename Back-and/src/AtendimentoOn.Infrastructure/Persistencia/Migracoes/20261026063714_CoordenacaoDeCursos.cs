using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AtendimentoOn.Infrastructure.Persistencia.Migracoes
{
    /// <inheritdoc />
    public partial class CoordenacaoDeCursos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CursoId",
                table: "Chamados",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Cursos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nome = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Grau = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Modalidade = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Ativo = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cursos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CoordenadoresCursos",
                columns: table => new
                {
                    CursosId = table.Column<int>(type: "int", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CoordenadoresCursos", x => new { x.CursosId, x.UsuarioId });
                    table.ForeignKey(
                        name: "FK_CoordenadoresCursos_Cursos_CursosId",
                        column: x => x.CursosId,
                        principalTable: "Cursos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CoordenadoresCursos_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Categorias",
                columns: new[] { "Id", "Ativa", "Equipe", "Nome" },
                values: new object[] { 6, true, "Coordenacao", "Coordenação de curso" });

            migrationBuilder.InsertData(
                table: "Cursos",
                columns: new[] { "Id", "Ativo", "Grau", "Modalidade", "Nome" },
                values: new object[,]
                {
                    { 1, true, "Bacharelado", "Presencial", "Administração" },
                    { 2, true, "Bacharelado", "Presencial", "Arquitetura e Urbanismo" },
                    { 3, true, "Bacharelado", "Presencial", "Biomedicina" },
                    { 4, true, "Bacharelado", "Presencial", "Ciências Biológicas" },
                    { 5, true, "Bacharelado", "Presencial", "Ciências Contábeis" },
                    { 6, true, "Bacharelado", "Presencial", "Comunicação Social – Publicidade e Propaganda" },
                    { 7, true, "Bacharelado", "Presencial", "Design" },
                    { 8, true, "Bacharelado", "Presencial", "Direito" },
                    { 9, true, "Bacharelado", "Presencial", "Educação Física" },
                    { 10, true, "Bacharelado", "Presencial", "Enfermagem" },
                    { 11, true, "Bacharelado", "Presencial", "Engenharia Ambiental" },
                    { 12, true, "Bacharelado", "Presencial", "Engenharia Civil" },
                    { 13, true, "Bacharelado", "Presencial", "Engenharia de Computação" },
                    { 14, true, "Bacharelado", "Presencial", "Engenharia de Produção" },
                    { 15, true, "Bacharelado", "Presencial", "Engenharia de Software" },
                    { 16, true, "Bacharelado", "Presencial", "Engenharia Elétrica" },
                    { 17, true, "Bacharelado", "Presencial", "Engenharia Mecânica" },
                    { 18, true, "Bacharelado", "Presencial", "Engenharia Mecatrônica" },
                    { 19, true, "Bacharelado", "Presencial", "Engenharia Química" },
                    { 20, true, "Bacharelado", "Presencial", "Farmácia" },
                    { 21, true, "Bacharelado", "Presencial", "Fisioterapia" },
                    { 22, true, "Bacharelado", "Presencial", "Medicina" },
                    { 23, true, "Bacharelado", "Presencial", "Medicina Veterinária" },
                    { 24, true, "Bacharelado", "Presencial", "Nutrição" },
                    { 25, true, "Bacharelado", "Presencial", "Odontologia" },
                    { 26, true, "Bacharelado", "Presencial", "Psicologia" },
                    { 27, true, "Bacharelado", "Presencial", "Serviço Social" },
                    { 28, true, "Licenciatura", "Presencial", "Ciências Biológicas" },
                    { 29, true, "Licenciatura", "Presencial", "Educação Física" },
                    { 30, true, "Licenciatura", "Presencial", "História" },
                    { 31, true, "Licenciatura", "Presencial", "Letras – Língua Portuguesa" },
                    { 32, true, "Licenciatura", "Presencial", "Matemática" },
                    { 33, true, "Licenciatura", "Presencial", "Pedagogia" },
                    { 34, true, "Tecnologo", "Presencial", "Análise e Desenvolvimento de Sistemas" },
                    { 35, true, "Tecnologo", "Presencial", "Estética e Cosmética" },
                    { 36, true, "Tecnologo", "Presencial", "Gastronomia" },
                    { 37, true, "Tecnologo", "Presencial", "Gestão da Tecnologia da Informação" },
                    { 38, true, "Tecnologo", "Presencial", "Gestão de Recursos Humanos" },
                    { 39, true, "Tecnologo", "Presencial", "Gestão Financeira" },
                    { 40, true, "Tecnologo", "Presencial", "Gestão Hospitalar" },
                    { 41, true, "Tecnologo", "Presencial", "Logística" },
                    { 42, true, "Tecnologo", "Presencial", "Marketing" },
                    { 43, true, "Tecnologo", "Presencial", "Processos Gerenciais" },
                    { 44, true, "Bacharelado", "EaD", "Administração" },
                    { 45, true, "Tecnologo", "EaD", "Análise e Desenvolvimento de Sistemas" },
                    { 46, true, "Bacharelado", "EaD", "Ciências Contábeis" },
                    { 47, true, "Bacharelado", "EaD", "Ciências Econômicas" },
                    { 48, true, "Tecnologo", "EaD", "Design de Interiores" },
                    { 49, true, "Bacharelado", "EaD", "Engenharia de Software" },
                    { 50, true, "Tecnologo", "EaD", "Gastronomia" },
                    { 51, true, "Tecnologo", "EaD", "Gestão Comercial" },
                    { 52, true, "Tecnologo", "EaD", "Gestão da Qualidade" },
                    { 53, true, "Tecnologo", "EaD", "Gestão da Tecnologia da Informação" },
                    { 54, true, "Tecnologo", "EaD", "Gestão de Recursos Humanos" },
                    { 55, true, "Tecnologo", "EaD", "Gestão de Serviços Judiciais e Notariais" },
                    { 56, true, "Tecnologo", "EaD", "Gestão do Agronegócio" },
                    { 57, true, "Tecnologo", "EaD", "Gestão Financeira" },
                    { 58, true, "Tecnologo", "EaD", "Gestão Pública" },
                    { 59, true, "Tecnologo", "EaD", "Logística" },
                    { 60, true, "Tecnologo", "EaD", "Marketing" },
                    { 61, true, "Tecnologo", "EaD", "Processos Gerenciais" },
                    { 62, true, "Tecnologo", "EaD", "Segurança do Trabalho" },
                    { 63, true, "Bacharelado", "EaD", "Teologia" },
                    { 64, true, "Bacharelado", "Semipresencial", "Agronomia" },
                    { 65, true, "Bacharelado", "Semipresencial", "Arquitetura e Urbanismo" },
                    { 66, true, "Licenciatura", "Semipresencial", "Artes Visuais" },
                    { 67, true, "Bacharelado", "Semipresencial", "Biomedicina" },
                    { 68, true, "Bacharelado", "Semipresencial", "Ciências Biológicas" },
                    { 69, true, "Licenciatura", "Semipresencial", "Ciências Biológicas" },
                    { 70, true, "Bacharelado", "Semipresencial", "Educação Física" },
                    { 71, true, "Licenciatura", "Semipresencial", "Educação Física" },
                    { 72, true, "Bacharelado", "Semipresencial", "Engenharia Ambiental" },
                    { 73, true, "Bacharelado", "Semipresencial", "Engenharia Civil" },
                    { 74, true, "Bacharelado", "Semipresencial", "Engenharia de Computação" },
                    { 75, true, "Bacharelado", "Semipresencial", "Engenharia de Produção" },
                    { 76, true, "Bacharelado", "Semipresencial", "Engenharia Elétrica" },
                    { 77, true, "Bacharelado", "Semipresencial", "Engenharia Mecânica" },
                    { 78, true, "Bacharelado", "Semipresencial", "Engenharia Mecatrônica" },
                    { 79, true, "Bacharelado", "Semipresencial", "Engenharia Química" },
                    { 80, true, "Tecnologo", "Semipresencial", "Estética e Cosmética" },
                    { 81, true, "Bacharelado", "Semipresencial", "Farmácia" },
                    { 82, true, "Licenciatura", "Semipresencial", "Filosofia" },
                    { 83, true, "Bacharelado", "Semipresencial", "Fisioterapia" },
                    { 84, true, "Licenciatura", "Semipresencial", "Geografia" },
                    { 85, true, "Licenciatura", "Semipresencial", "História" },
                    { 86, true, "Licenciatura", "Semipresencial", "Letras – Língua Portuguesa" },
                    { 87, true, "Licenciatura", "Semipresencial", "Matemática" },
                    { 88, true, "Bacharelado", "Semipresencial", "Nutrição" },
                    { 89, true, "Licenciatura", "Semipresencial", "Pedagogia" },
                    { 90, true, "Bacharelado", "Semipresencial", "Psicopedagogia" },
                    { 91, true, "Bacharelado", "Semipresencial", "Serviço Social" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Chamados_CursoId",
                table: "Chamados",
                column: "CursoId");

            migrationBuilder.CreateIndex(
                name: "IX_CoordenadoresCursos_UsuarioId",
                table: "CoordenadoresCursos",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Cursos_Nome_Grau_Modalidade",
                table: "Cursos",
                columns: new[] { "Nome", "Grau", "Modalidade" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Chamados_Cursos_CursoId",
                table: "Chamados",
                column: "CursoId",
                principalTable: "Cursos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Chamados_Cursos_CursoId",
                table: "Chamados");

            migrationBuilder.DropTable(
                name: "CoordenadoresCursos");

            migrationBuilder.DropTable(
                name: "Cursos");

            migrationBuilder.DropIndex(
                name: "IX_Chamados_CursoId",
                table: "Chamados");

            migrationBuilder.DeleteData(
                table: "Categorias",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DropColumn(
                name: "CursoId",
                table: "Chamados");
        }
    }
}
