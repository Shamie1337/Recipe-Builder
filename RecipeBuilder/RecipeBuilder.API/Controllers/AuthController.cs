using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeBuilder.API.Data;
using RecipeBuilder.API.DTOs;
using RecipeBuilder.API.Models;
using BCrypt.Net; 

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
    }
}