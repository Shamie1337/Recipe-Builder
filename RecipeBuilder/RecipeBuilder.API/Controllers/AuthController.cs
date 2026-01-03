using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeBuilder.API.Data;
using RecipeBuilder.API.DTOs;
using RecipeBuilder.API.Models;
using BCrypt.Net; 
using Google.Apis.Auth;

namespace RecipeBuilder.API.Controllers
{
    
    [Route("api/[controller]")] 
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        // РЕГИСТРАЦИЯ
        // Адрес: POST api/Auth/register
        [HttpPost("register")]
        public async Task<ActionResult<User>> Register(RegisterDto request)
        {
            // Проверка дали има такъв потребител
            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
            {
                return BadRequest("Това потребителско име вече е заетьо.");
            }
            
            
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest("Този имейл вече е регистриран.");
            }

            // 2. Хеширане на паролата
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            // 3. Създаване на потребителя
            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = passwordHash
               
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(user);
        }

      
        // Адрес: POST api/Auth/login
        [HttpPost("login")]
        public async Task<ActionResult<User>> Login(LoginDto request)
        {
            // Търсим потребителя
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == request.Username);

            if (user == null)
            {
                return BadRequest("Грешно име или парола.");
            }

            // Проверяваме паролата
            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return BadRequest("Грешно име или парола.");
            }

            
            return Ok(user);
        }
        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
        {
            try
            {
                // 1. Валидираме токена директно с Google
                var payload = await GoogleJsonWebSignature.ValidateAsync(request.Token);

                // 2. Проверяваме дали вече имаме такъв потребител 
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == payload.Email);

                if (user == null)
                {
                    // 3. Ако го няма, го създаваме автоматично
                    user = new User
                    {
                        Username = payload.Name, // Взимаме името от Google
                        Email = payload.Email,
                        // Генерираме случайна парола, тъй като той влиза с Google
                        PasswordHash = Guid.NewGuid().ToString() 
                    };

                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();
                }

                // 4. Връщаме потребителя, все едно се е логнал нормално
                return Ok(user);
            }
            catch (Exception ex)
            {
                return BadRequest("Невалиден Google токен: " + ex.Message);
            }
        }
    }
    public class LoginRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }
    
}