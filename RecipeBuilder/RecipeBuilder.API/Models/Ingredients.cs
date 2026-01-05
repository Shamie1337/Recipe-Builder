using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace RecipeBuilder.API.Models
{
    public class Ingredient
    {

        public int Id { get; set; }

        [Required(ErrorMessage = "Името на продукта е задължително.")]
        [StringLength(100, ErrorMessage = "Името не може да е по-дълго от 100 символа.")]
        public string Name { get; set; }
        public string? Barcode { get; set; }
        [Range(0.01, 1000, ErrorMessage = "Цената трябва да е положително число.")]
        public decimal EstPrice { get; set; }

        public double CaloriesPer100g { get; set; } // Калории (kcal)
        public double ProteinsPer100g { get; set; } // Протеини
        public double CarbsPer100g { get; set; }    // Въглехидрати
        public double FatsPer100g { get; set; }     // Мазнини
        
        // Списък с рецепти, в които участва
        [JsonIgnore]
        public List<RecipeIngredient> RecipeIngredients { get; set; } = new();
    }
}