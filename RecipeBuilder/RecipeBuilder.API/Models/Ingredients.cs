namespace RecipeBuilder.API.Models
{
    public class Ingredient
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string? Barcode { get; set; }
        public decimal EstPrice { get; set; }
        
        // Списък с рецепти, в които участва
        public List<RecipeIngredient> RecipeIngredients { get; set; } = new();
    }
}