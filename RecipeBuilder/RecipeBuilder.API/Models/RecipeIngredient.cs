using System.Text.Json.Serialization;

namespace RecipeBuilder.API.Models
{
    public class RecipeIngredient
    {
        public int Id {get; set;}
        public int RecipeId {get; set;}
    
        [JsonIgnore] // To prevent circular reference during serialization
        public Recipe? Recipe { get; set; }

        public int IngredientId { get; set; }
        public Ingredient? Ingredient { get; set; }

        public decimal Quantity { get; set; }
        public string Unit { get; set; } = "g";
    
    }
}