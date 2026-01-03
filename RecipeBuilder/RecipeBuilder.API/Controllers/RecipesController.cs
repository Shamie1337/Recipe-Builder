using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeBuilder.API.Data;
using RecipeBuilder.API.Models;

namespace RecipeBuilder.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RecipesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RecipesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Recipes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Recipe>>> GetRecipes()
        {
            return await _context.Recipes
                .Include(r => r.RecipeIngredients)
                .ThenInclude(ri => ri.Ingredient)
                .Include(r => r.User)
                .ToListAsync();
        }

        // GET: api/Recipes/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Recipe>> GetRecipe(int id)
        {
            var recipe = await _context.Recipes
                .Include(r => r.RecipeIngredients)
                .ThenInclude(ri => ri.Ingredient)
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (recipe == null) return NotFound();

            return recipe;
        }

        // POST: api/Recipes
        [HttpPost]
        public async Task<ActionResult<Recipe>> PostRecipe(Recipe recipe)
        {
            _context.Recipes.Add(recipe);
            await _context.SaveChangesAsync();

           if (recipe.UserId != null)
            {
                await _context.Entry(recipe).Reference(r => r.User).LoadAsync();
            }

            return CreatedAtAction(nameof(GetRecipe), new { id = recipe.Id }, recipe);
        }

        // DELETE: api/Recipes/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRecipe(int id, [FromQuery] int userId)
        {
            var recipe = await _context.Recipes.FindAsync(id);
            if (recipe == null) return NotFound("Рецептата не е намерена.");

            // Проверка за nullable UserId
            if (recipe.UserId != userId)
            {
                return StatusCode(403, "Нямате право да триете тази рецепта!");
            }

            _context.Recipes.Remove(recipe);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/Recipes/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRecipe(int id, Recipe recipeUpdate, [FromQuery] int userId)
        {
            if (id != recipeUpdate.Id) return BadRequest();

            var existingRecipe = await _context.Recipes
                .Include(r => r.RecipeIngredients)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (existingRecipe == null) return NotFound();

            if (existingRecipe.UserId != userId)
            {
                return StatusCode(403, "Нямате право да редактирате тази рецепта!");
            }

            // Обновяваме с ТВОИТЕ полета
            existingRecipe.Title = recipeUpdate.Title;
            existingRecipe.Instructions = recipeUpdate.Instructions; 
            existingRecipe.CookingTimeMinutes = recipeUpdate.CookingTimeMinutes;

            // Обновяване на съставките
            existingRecipe.RecipeIngredients.Clear();
            foreach (var item in recipeUpdate.RecipeIngredients)
            {
                existingRecipe.RecipeIngredients.Add(item);
            }

            try
            {
                await _context.SaveChangesAsync();
                // Зареждаме автора отново за Front-end-а
                await _context.Entry(existingRecipe).Reference(r => r.User).LoadAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Recipes.Any(e => e.Id == id)) return NotFound();
                else throw;
            }

            return Ok(existingRecipe);
        }

        // POST: api/Recipes/5/favorite
        [HttpPost("{id}/favorite")]
        public async Task<IActionResult> ToggleFavorite(int id, [FromQuery] int userId)
        {
            var user = await _context.Users
                .Include(u => u.FavoriteRecipes)
                .FirstOrDefaultAsync(u => u.Id == userId);
            
            var recipe = await _context.Recipes.FindAsync(id);

            if (recipe == null || user == null) return NotFound();

            if (recipe.UserId == userId)
                return BadRequest("Не можеш да добавяш свои рецепти в любими!");

            var existing = user.FavoriteRecipes.FirstOrDefault(r => r.Id == id);
            
            if (existing != null)
            {
                user.FavoriteRecipes.Remove(existing);
                await _context.SaveChangesAsync();
                return Ok("Рецептата е премахната от любими.");
            }
            else
            {
                user.FavoriteRecipes.Add(recipe);
                await _context.SaveChangesAsync();
                return Ok("Рецептата е добавена в любими! ❤️");
            }
        }

        [HttpGet("my-favorites")]
        public async Task<ActionResult<IEnumerable<Recipe>>> GetMyFavorites([FromQuery] int userId)
        {
            var user = await _context.Users
                .Include(u => u.FavoriteRecipes)
                .ThenInclude(r => r.User)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return NotFound();

            return Ok(user.FavoriteRecipes);
        }
    }
}