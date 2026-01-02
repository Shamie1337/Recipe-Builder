using Microsoft.EntityFrameworkCore;
using RecipeBuilder.API.Models;

namespace RecipeBuilder.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Recipe> Recipes { get; set;}
        public DbSet<Ingredient> Ingredients { get; set;}

        public DbSet<RecipeIngredient> RecipeIngredients { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Конфигуриране на връзката много към много между Recipe и Ingredient чрез RecipeIngredient

            modelBuilder.Entity<RecipeIngredient>()
                .HasOne(ri => ri.Recipe)
                .WithMany(r => r.RecipeIngredients)
                .HasForeignKey(ri => ri.RecipeId);

            modelBuilder.Entity<RecipeIngredient>()
            .HasOne(ri => ri.Ingredient)
            .WithMany(i => i.RecipeIngredients)
            .HasForeignKey(ri => ri.IngredientId);

            modelBuilder.Entity<User>()
                .HasMany(u => u.FavoriteRecipes)
                .WithMany(r => r.FavoritedByUsers)
                .UsingEntity(j => j.ToTable("UserFavorites"));

            modelBuilder.Entity<Recipe>()
                .HasOne(r => r.User)
                .WithMany(u => u.CreatedRecipes)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        
        
        }      


     }
}