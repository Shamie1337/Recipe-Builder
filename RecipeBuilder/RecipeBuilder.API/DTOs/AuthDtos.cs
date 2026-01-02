using System.ComponentModel.DataAnnotations;

namespace RecipeBuilder.API.DTOs
{

    public class RegisterDto
    {
        [Required]
        public string Username { get; set; } = string.Empty;

        [Required]
        [RegularExpression(@"^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$", ErrorMessage = "Въведете валиден имейл адрес (напр. ime@domain.com).")]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6, ErrorMessage = "Паролата трябва да е поне 6 символа.")]
        public string Password { get; set; } = string.Empty;
    }

   
    public class LoginDto
    {
        [Required]
        public string Username { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }
}