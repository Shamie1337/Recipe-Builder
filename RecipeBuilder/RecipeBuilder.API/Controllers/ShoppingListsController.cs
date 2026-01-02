using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeBuilder.API.Data;
using RecipeBuilder.API.DTOs; // Не забравяй да импортнеш DTO-то
using RecipeBuilder.API.Models;

namespace RecipeBuilder.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ShoppingListsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ShoppingListsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/ShoppingLists/from-recipe/1
        [HttpGet("from-recipe/{recipeId}")]
        public async Task<ActionResult<ShoppingListResponseDto>> GenerateFromRecipe(int recipeId)
        {
            // 1. Извличаме рецептата, но ВКЛЮЧВАМЕ (Include) свързаните данни
            var recipe = await _context.Recipes
                .Include(r => r.RecipeIngredients) // Зареди връзката
                    .ThenInclude(ri => ri.Ingredient) // Зареди и самия продукт (за името и цената)
                .FirstOrDefaultAsync(r => r.Id == recipeId);

            if (recipe == null)
            {
                return NotFound("Рецептата не е намерена.");
            }

            // 2. Мапване (Прехвърляне) на данните към DTO
            // Тук превръщаме сложните DB данни в прост списък за пазаруване
            var response = new ShoppingListResponseDto
            {
                RecipeName = recipe.Title,
                Items = recipe.RecipeIngredients.Select(ri => new ShoppingItemDto
                {
                    Name = ri.Ingredient.Name,
                    Quantity = ri.Quantity,
                    Unit = ri.Unit,
                    // Примерна логика за цена: (ако цената в базата е за 1 кг/бр, трябва да се сметне)
                    // За по-просто в момента взимаме базовата цена на продукта
                    EstimatedPrice = ri.Ingredient.EstPrice 
                }).ToList()
            };

            // 3. Изчисляване на общата сума
            response.TotalPrice = response.Items.Sum(i => i.EstimatedPrice);

            return Ok(response);
        }
    }
}