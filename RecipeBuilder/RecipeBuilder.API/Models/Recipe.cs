using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace RecipeBuilder.API.Models
{
    public class Recipe
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Заглавието на рецептата е задължително.")]
        [StringLength(200, MinimumLength = 3, ErrorMessage = "Заглавието трябва да е между 3 и 200 символа.")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Инструкциите са задължителни.")]
        public string Instructions { get; set; } = string.Empty;
        public int CookingTimeMinutes { get; set; }
        
        // Списък с необходими продукти
        
        public List<RecipeIngredient> RecipeIngredients { get; set; } = new();
    }
}