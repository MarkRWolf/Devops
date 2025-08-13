using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Devops.Migrations
{
    /// <inheritdoc />
    public partial class UserAzureWebhookSecret : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EncryptedAzureWebhookSecret",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EncryptedAzureWebhookSecret",
                table: "AspNetUsers");
        }
    }
}
