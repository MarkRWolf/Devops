using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Devops.Migrations
{
    /// <inheritdoc />
    public partial class AzureCreds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "EncryptedAzureDevOpsToken",
                table: "AspNetUsers",
                newName: "EncryptedAzurePat");

            migrationBuilder.AddColumn<string>(
                name: "AzureOrganization",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AzureProject",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HasAzureConfig",
                table: "AspNetUsers",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AzureOrganization",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "AzureProject",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "HasAzureConfig",
                table: "AspNetUsers");

            migrationBuilder.RenameColumn(
                name: "EncryptedAzurePat",
                table: "AspNetUsers",
                newName: "EncryptedAzureDevOpsToken");
        }
    }
}
