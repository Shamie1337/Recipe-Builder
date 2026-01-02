namespace RecipeBuilder.API.DTOs
{
    public class ShoppingItemDto
    {
        public string Name { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal EstimatedPrice { get; set; }
    }

    public class ShoppingListResponseDto
    {
        public string RecipeName { get; set; } = string.Empty;
        public List<ShoppingItemDto> Items { get; set; } = new();
        public decimal TotalPrice { get; set; }
    }
}