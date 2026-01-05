using Microsoft.EntityFrameworkCore;
using RecipeBuilder.API.Data;
using System.Text.Json.Serialization;
using RecipeBuilder.API.Services;
var builder = WebApplication.CreateBuilder(args);

// Разрешаваме на всеки (AllowAnyOrigin) да пита нашето API.
// В реално приложение тук бихме сложили само адреса на нашия сайт, но за разработка е ОК така.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Взимаме връзката от appsettings.json
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// Казваме на приложението да ползва SQLite с нашия AppDbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(connectionString));

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddControllers()
.AddJsonOptions(options =>
    {

        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddScoped<EmailService>();

var app = builder.Build();

app.UseCors("AllowAll");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

//app.UseHttpsRedirection();


app.MapControllers();
app.Run();

