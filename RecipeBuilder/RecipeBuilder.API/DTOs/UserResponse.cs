namespace RecipeBuilder.API.DTOs
{
    public class UserResponseDto
    {
        public int Id { get; set; } 
        public string Username { get; set; }
        public string Email { get; set; }
        public bool IsVerified { get; set; }
    }
}