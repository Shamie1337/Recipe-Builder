using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeBuilder.API.Data;
using RecipeBuilder.API.Models;


namespace RecipeBuilder.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    //izpolzvam ControllerBase vmesto Controller, zashtoto ne izpolzvam Views (dobra praktika e bilo)
        public class RecipesController : ControllerBase //Tova e bazoviyat controller za upravlenie na recepti i e nasleden ot ControllerBase
    {
        //Dependency Inject na AppDbContext za dostup do bazata danni
        private readonly AppDbContext _context;

        public RecipesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Recipes - vrushta spisuk s vsichki recep
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Recipe>>> GetRecipes()
        {
            return await _context.Recipes.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Recipe>> PostRecipe(Recipe recipe)
        {
            _context.Recipes.Add(recipe);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetRecipe", new { id = recipe.Id }, recipe);
        }

        // GET: api/Recipes/5 - vrushta opredelena recepta po ID
        [HttpGet("{id}")]
        public async Task<ActionResult<Recipe>> GetRecipe(int id)
        {
            var recipe = await _context.Recipes.FindAsync(id);

            if (recipe == null)
            {
                return NotFound();
            }

            return recipe;
        }
    }
}