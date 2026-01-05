using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeBuilder.API.Data;
using RecipeBuilder.API.DTOs;
using RecipeBuilder.API.Models;
using BCrypt.Net; 
using Google.Apis.Auth;
using RecipeBuilder.API.Services;
using System.Net.Http;
using System.Text.Json;

namespace RecipeBuilder.API.Controllers
{
    
    [Route("api/[controller]")] 
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly EmailService _emailService;

       
        public AuthController(AppDbContext context, EmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        // РЕГИСТРАЦИЯ
        // Адрес: POST api/Auth/register
        [HttpPost("register")]
        public async Task<ActionResult<UserResponseDto>> Register(RegisterDto request)
        {
            // Проверка дали има такъв потребител
            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
            {
                return BadRequest("Това потребителско име вече е заето.");
            }
            
            
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest("Този имейл вече е регистриран.");
            }

            var code = Random.Shared.Next(100000, 999999).ToString();

            _emailService.SendVerificationEmail(request.Email, code);
            

            // 2. Хеширане на паролата
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            // 3. Създаване на потребителя
            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = passwordHash,
                VerificationCode = code,
                IsVerified = false
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Registration successful. Please verify email." });
        }

        [HttpPost("verify")]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null) return BadRequest("Потребител не е намерен.");

            if (user.VerificationCode == request.Code)
            {
                user.IsVerified = true;
                user.VerificationCode = null;
                await _context.SaveChangesAsync();
                
                // Връщаме безопасно DTO
                return Ok(MapToDto(user));
            }

            return BadRequest("Грешен код за потвърждение!");
        }

        // Адрес: POST api/Auth/login
        [HttpPost("login")]
        public async Task<ActionResult<UserResponseDto>> Login(LoginDto request)
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

            if (!user.IsVerified)
            {
                return BadRequest("Моля, потвърдете имейла си преди вход!");
            }
            
            // Връщаме безопасно DTO
            return Ok(MapToDto(user));
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
                        PasswordHash = Guid.NewGuid().ToString(),
                        IsVerified = true
                    };

                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();
                }

                // 4. Връщаме потребителя, все едно се е логнал нормално (като DTO)
                return Ok(MapToDto(user));
            }
            catch (Exception ex)
            {
                return BadRequest("Невалиден Google токен: " + ex.Message);
            }
        }
        
        // ИЗТРИВАНЕ НА ПРОФИЛ
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAccount(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound("Потребителят не е намерен.");
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }


        // Помощен метод за преобразуване към DTO
        private UserResponseDto MapToDto(User user)
        {
            return new UserResponseDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                IsVerified = user.IsVerified
            };
        }
    }

    public class VerifyRequest
    {
        public string Email { get; set; }
        public string Code { get; set; }
    }
}