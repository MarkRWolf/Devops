using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Devops.Migrations
{
    /// <inheritdoc />
    public partial class UserWebhookSecret : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EncryptedGitHubWebhookSecret",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EncryptedGitHubWebhookSecret",
                table: "AspNetUsers");
        }
    }
}
