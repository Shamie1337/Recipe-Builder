namespace RecipeBuilder.API.Models
{
    public class Recipe
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Instructions { get; set; } = string.Empty;
        public int CookingTimeMinutes { get; set; }
        
        // Списък с необходими продукти
        public List<RecipeIngredient> RecipeIngredients { get; set; } = new();
    }
}