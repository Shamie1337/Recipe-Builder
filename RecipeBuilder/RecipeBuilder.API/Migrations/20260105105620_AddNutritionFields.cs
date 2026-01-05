using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecipeBuilder.API.Migrations
{
    /// <inheritdoc />
    public partial class AddNutritionFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "CaloriesPer100g",
                table: "Ingredients",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "CarbsPer100g",
                table: "Ingredients",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "FatsPer100g",
                table: "Ingredients",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "ProteinsPer100g",
                table: "Ingredients",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CaloriesPer100g",
                table: "Ingredients");

            migrationBuilder.DropColumn(
                name: "CarbsPer100g",
                table: "Ingredients");

            migrationBuilder.DropColumn(
                name: "FatsPer100g",
                table: "Ingredients");

            migrationBuilder.DropColumn(
                name: "ProteinsPer100g",
                table: "Ingredients");
        }
    }
}
