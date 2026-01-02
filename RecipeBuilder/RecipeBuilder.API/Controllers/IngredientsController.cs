using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeBuilder.API.Data;
using RecipeBuilder.API.Models;

namespace RecipeBuilder.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class IngredientsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public IngredientsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Ingredients - vrushta spisuk s vsichki ingredienti
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Ingredient>>> GetIngredients()
        {
            return await _context.Ingredients.ToListAsync();
        }

        // POST: api/Ingredients - dobavya nov ingredient
        [HttpPost]
        public async Task<ActionResult<Ingredient>> PostIngredient(Ingredient ingredient)
        {
            _context.Ingredients.Add(ingredient);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetIngredient", new { id = ingredient.Id }, ingredient);
        }

        // GET: api/Ingredients/5 - vrushta opredelen ingredient po ID
        [HttpGet("{id}")]
        public async Task<ActionResult<Ingredient>> GetIngredient(int id)
        {
            var ingredient = await _context.Ingredients.FindAsync(id);

            if (ingredient == null)
            {
                return NotFound();
            }

            return ingredient;
        }



// GET: api/Ingredients/search?name=кар
[HttpGet("search")]
public async Task<ActionResult<IEnumerable<Ingredient>>> SearchIngredients([FromQuery] string name)
{
    if (string.IsNullOrWhiteSpace(name))
    {
        return BadRequest("Моля въведете име за търсене.");
    }

    
    // Когато само четем данни и няма да ги променяме веднага, ползваме AsNoTracking().
    // Това казва на EF Core: "Не следи тези обекти за промени". 
    var allIngredients = await _context.Ingredients
                                       .AsNoTracking() 
                                       .ToListAsync();

    // Тук използваме мощта на .NET за работа с текст (StringComparison)
    // CurrentCultureIgnoreCase работи коректно с Кирилица, немски умлаути и т.н.
    var result = allIngredients
        .Where(i => i.Name.Contains(name, StringComparison.CurrentCultureIgnoreCase))
        .ToList();

    return Ok(result);
}
    }
}