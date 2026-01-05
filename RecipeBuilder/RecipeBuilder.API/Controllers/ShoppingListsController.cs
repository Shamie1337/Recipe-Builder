using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeBuilder.API.Data;
using RecipeBuilder.API.DTOs; 
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
            
            var recipe = await _context.Recipes
                .Include(r => r.RecipeIngredients) 
                    .ThenInclude(ri => ri.Ingredient) 
                .FirstOrDefaultAsync(r => r.Id == recipeId);

            if (recipe == null)
            {
                return NotFound("Рецептата не е намерена.");
            }

            // 2. Създаване на ShoppingListResponseDto с изчислени цени
            var response = new ShoppingListResponseDto
            {
                RecipeName = recipe.Title,
                Items = recipe.RecipeIngredients.Select(ri => new ShoppingItemDto
                {
                    Name = ri.Ingredient.Name,
                    Quantity = ri.Quantity,
                    Unit = ri.Unit,
                    
                    // БИЗНЕС ЛОГИКА ЗА ЦЕНАТА:
                    // Проверяваме мерната единица и смятаме реалната цена
                    EstimatedPrice = (ri.Unit == "g" || ri.Unit == "ml")
                        ? (ri.Ingredient.EstPrice / 1000) * ri.Quantity // Ако е грамове -> делим на 1000
                        : ri.Ingredient.EstPrice * ri.Quantity          // Ако е кг/бр -> умножаваме директно
                }).ToList()
            };

            // 3. Изчисляване на общата сума (сумираме вече изчислените цени)
            response.TotalPrice = response.Items.Sum(i => i.EstimatedPrice);

            return Ok(response);
        }
    }
}