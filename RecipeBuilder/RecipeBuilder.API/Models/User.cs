using System.Text.Json.Serialization;

namespace RecipeBuilder.API.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        
        // пазя хеша, не истинската парола!
        [JsonIgnore] 
        public string PasswordHash { get; set; } = string.Empty;

      

        [JsonIgnore]      
        public List<Recipe> CreatedRecipes { get; set; } = new();
        public List<Recipe> FavoriteRecipes { get; set; } = new();
    }
}