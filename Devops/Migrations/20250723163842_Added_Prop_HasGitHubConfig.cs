using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Devops.Migrations
{
    /// <inheritdoc />
    public partial class Added_Prop_HasGitHubConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HasGitHubConfig",
                table: "AspNetUsers",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HasGitHubConfig",
                table: "AspNetUsers");
        }
    }
}
