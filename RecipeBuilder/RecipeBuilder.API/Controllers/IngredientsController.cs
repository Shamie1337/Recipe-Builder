using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeBuilder.API.Data;
using RecipeBuilder.API.Models;
using System.Text.Json; 
using System.Net.Http;  

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

            // CurrentCultureIgnoreCase работи коректно с Кирилица, немски умлаути и т.н.
            var result = allIngredients
                .Where(i => i.Name.Contains(name, StringComparison.CurrentCultureIgnoreCase))
                .ToList();

            return Ok(result);
        }

        
        // POST: api/Ingredients/add-from-barcode/3017620422003
        [HttpPost("add-from-barcode/{barcode}")]
        public async Task<ActionResult<Ingredient>> AddFromOpenFoodFacts(string barcode)
        {
            // 1. Първо проверяваме дали вече нямаме този продукт в нашата база
            var existingIngredient = await _context.Ingredients
                .FirstOrDefaultAsync(i => i.Barcode == barcode);

            if (existingIngredient != null)
            {
                return Ok(existingIngredient); // Ако го има, връщаме го веднага
            }

            // 2. Ако го няма, правим заявка към Open Food Facts
            using var httpClient = new HttpClient();
            var url = $"https://world.openfoodfacts.org/api/v0/product/{barcode}.json";

            try
            {
                var response = await httpClient.GetAsync(url);
                if (!response.IsSuccessStatusCode)
                {
                    return BadRequest("Грешка при връзка с Open Food Facts.");
                }

                var jsonString = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(jsonString);
                var root = doc.RootElement;

                // Проверяваме статуса (1 значи намерен, 0 значи не е намерен)
                if (root.GetProperty("status").GetInt32() != 1)
                {
                    return NotFound("Продуктът не е намерен в Open Food Facts.");
                }

                var product = root.GetProperty("product");

                // Извличаме името
                string productName = product.TryGetProperty("product_name", out var nameEl) 
                    ? nameEl.GetString() ?? "Неизвестен продукт" 
                    : "Неизвестен продукт";

                // Извличаме нутриентите (ако ги има)
                var nutriments = product.GetProperty("nutriments");

                double GetNutrient(string key) 
                {
                    if (nutriments.TryGetProperty(key, out var el) && el.ValueKind == JsonValueKind.Number)
                    {
                        return el.GetDouble();
                    }
                    return 0;
                }

                // 3. Създаваме новия обект
                var newIngredient = new Ingredient
                {
                    Name = productName,
                    Barcode = barcode,
                    EstPrice = 0, // Потребителят ще си въведе цена по-късно
                    
                    // Попълваме новите полета
                    CaloriesPer100g = GetNutrient("energy-kcal_100g"),
                    ProteinsPer100g = GetNutrient("proteins_100g"),
                    CarbsPer100g    = GetNutrient("carbohydrates_100g"),
                    FatsPer100g     = GetNutrient("fat_100g")
                };

                // 4. Записване в базата
                _context.Ingredients.Add(newIngredient);
                await _context.SaveChangesAsync();

                return Ok(newIngredient);
            }
            catch (Exception ex)
            {
                return BadRequest("Възникна грешка при обработката на данните: " + ex.Message);
            }
        }

        [HttpGet("search-external")]
        public async Task<IActionResult> SearchOpenFoodFacts([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query)) return BadRequest("Въведете име.");

            using var httpClient = new HttpClient();
            var url = $"https://world.openfoodfacts.org/cgi/search.pl?search_terms={query}&search_simple=1&action=process&json=1&page_size=10";

            try
            {
                httpClient.DefaultRequestHeaders.Add("User-Agent", "RecipeBuilderApp - Android - Version 1.0");

                var response = await httpClient.GetAsync(url);
                var jsonString = await response.Content.ReadAsStringAsync();

                using var doc = JsonDocument.Parse(jsonString);
                var root = doc.RootElement;

                if (!root.TryGetProperty("products", out var productsElement))
                {
                    return Ok(new List<object>());
                }

                var results = productsElement.EnumerateArray().Select(p => new
                {
                    Name = p.TryGetProperty("product_name", out var n) ? n.GetString() : "Без име",
                    Brand = p.TryGetProperty("brands", out var b) ? b.GetString() : "",
                    Barcode = p.TryGetProperty("code", out var c) ? c.GetString() : ""
                })
                .Where(x => !string.IsNullOrEmpty(x.Barcode))
                .ToList();

                return Ok(results);
            }
            catch (Exception ex)
            {
                return BadRequest("Грешка при търсене: " + ex.Message);
            }
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteIngredient(int id)
        {
            var ingredient = await _context.Ingredients.FindAsync(id);
            if (ingredient == null)
            {
                return NotFound("Продуктът не е намерен.");
            }
            try 
            {
                _context.Ingredients.Remove(ingredient);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                return BadRequest("Не може да изтриете този продукт, защото вероятно участва в някоя рецепта. Първо го махнете от рецептите.");
            }

            return NoContent();
        }
    }
}