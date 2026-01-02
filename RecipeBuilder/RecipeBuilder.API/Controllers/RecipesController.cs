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

            if (recipe == null)
            {
                return NotFound();
            }

            return recipe;
        }

        // POST: api/Recipes
        [HttpPost]
        public async Task<ActionResult<Recipe>> PostRecipe(Recipe recipe)
        {
            recipe.Id = 0; 
            
            _context.Recipes.Add(recipe);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetRecipe), new { id = recipe.Id }, recipe);
        }

        // DELETE: api/Recipes/5?userId=1
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRecipe(int id, [FromQuery] int userId)
        {
            var recipe = await _context.Recipes.FindAsync(id);

            if (recipe == null)
            {
                return NotFound("Рецептата не е намерена.");
            }
            if (recipe.UserId != userId)
            {
                return StatusCode(403, "Нямате право да триете тази рецепта, защото не сте нейният автор!");
            }

            _context.Recipes.Remove(recipe);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Recipes/5/favorite?userId=1
        [HttpPost("{id}/favorite")]
        public async Task<IActionResult> ToggleFavorite(int id, [FromQuery] int userId)
        {
            // 1. Зареждаме потребителя с неговите любими рецепти
            var user = await _context.Users
                .Include(u => u.FavoriteRecipes)
                .FirstOrDefaultAsync(u => u.Id == userId);

            // 2. Проверяваме дали рецептата изобщо съществува в базата
            var recipe = await _context.Recipes.FindAsync(id);

            if (recipe == null || user == null) 
                return NotFound("Рецептата или потребителят не са намерени.");

            // 3. Не можеш да харесваш собствената си рецепта
            if (recipe.UserId == userId)
            {
                return BadRequest("Не можеш да добавяш свои рецепти в любими!");
            }

            // 4. Проверка дали вече е в любими
            var existingFavorite = user.FavoriteRecipes.FirstOrDefault(r => r.Id == id);

            if (existingFavorite != null)
            {
                // ВЕЧЕ Е ЛЮБИМА -> ПРЕМАХВАМЕ
                // Премахваме конкретната инстанция от списъка на потребителя
                user.FavoriteRecipes.Remove(existingFavorite);
                await _context.SaveChangesAsync();
                return Ok("Рецептата е премахната от любими.");
            }
            else
            {
                // НЕ Е ЛЮБИМА -> ДОБАВЯМЕ
                user.FavoriteRecipes.Add(recipe);
                await _context.SaveChangesAsync();
                return Ok("Рецептата е добавена в любими! ❤️");
            }
        }

        // GET: api/Recipes/my-favorites?userId=1
        [HttpGet("my-favorites")]
        public async Task<ActionResult<IEnumerable<Recipe>>> GetMyFavorites([FromQuery] int userId)
        {
            var user = await _context.Users
                .Include(u => u.FavoriteRecipes)
                    .ThenInclude(r => r.User) // За да видим автора на любимата рецепта
                .Include(u => u.FavoriteRecipes)
                    .ThenInclude(r => r.RecipeIngredients) // За да видим съставките
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return NotFound("Потребителят не е намерен.");

            return Ok(user.FavoriteRecipes);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRecipe(int id, Recipe recipeUpdate, [FromQuery] int userId)
        {
            // Проверка дали ID-то в URL-а съвпада с ID-то в обекта
            if (id != recipeUpdate.Id)
            {
                return BadRequest("ID-то на рецептата не съвпада.");
            }

            // 1. Намираме съществуващата рецепта в базата
            var existingRecipe = await _context.Recipes.FindAsync(id);

            if (existingRecipe == null)
            {
                return NotFound("Рецептата не е намерена.");
            }

            // 2. ЗАЩИТА: Проверяваме дали текущият потребител е собственикът
            if (existingRecipe.UserId != userId)
            {
                return StatusCode(403, "Нямате право да редактирате тази рецепта, защото не сте нейният автор!");
            }

            // 3. Обновяваме само нужните полета
            // ВАЖНО: Не обновяваме директно целия обект, за да не счупим UserId или Id
            existingRecipe.Title = recipeUpdate.Title;
            existingRecipe.Instructions = recipeUpdate.Instructions;
            existingRecipe.CookingTimeMinutes = recipeUpdate.CookingTimeMinutes;
          
            
            // (Забележка: Обновяването на списъка със съставки (Ingredients) е по-сложно 
            // и обикновено изисква изтриване на старите и добавяне на новите, 
            // но засега ще обновим само основната информация).

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if ((id != existingRecipe.Id) || (userId != existingRecipe.UserId))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent(); // 204 No Content е стандартен отговор при успешна редакция
        }
    }
}