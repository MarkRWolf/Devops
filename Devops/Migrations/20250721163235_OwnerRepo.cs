using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Devops.Migrations
{
    /// <inheritdoc />
    public partial class OwnerRepo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GitHubOwnerRepo",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GitHubOwnerRepo",
                table: "AspNetUsers");
        }
    }
}
