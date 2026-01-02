import { useState, useEffect } from 'react'
import RecipeForm from './components/RecipeForm';
import IngredientForm from './components/IngredientForm';
import AuthForm from './components/AuthForm';

function App() {
  // --- STATE ---
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = localStorage.getItem("recipeAppUser");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [recipes, setRecipes] = useState([]);
  const [shoppingList, setShoppingList] = useState(null); 
  const [ingredientsRefreshTrigger, setIngredientsRefreshTrigger] = useState(0);
  
  
  const [view, setView] = useState("all"); 

  // --- API ФУНКЦИИ ---

  // 1. Тегли ВСИЧКИ рецепти
  const fetchAllRecipes = () => {
    fetch('http://localhost:5182/api/Recipes')
      .then(res => res.json())
      .then(data => setRecipes(data))
      .catch(err => console.error(err));
  };

  //Тегли само ЛЮБИМИТЕ
  const fetchFavoriteRecipes = () => {
    if (!currentUser) return;
    fetch(`http://localhost:5182/api/Recipes/my-favorites?userId=${currentUser.id}`)
      .then(res => res.json())
      .then(data => setRecipes(data))
      .catch(err => console.error(err));
  };

  
  useEffect(() => {
    if (currentUser) {
      if (view === "all") {
        fetchAllRecipes();
      } else {
        fetchFavoriteRecipes();
      }
    }
  }, [currentUser, view]); // Изпълнява се, когато сменим изгледа

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem("recipeAppUser", JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("recipeAppUser");
    setShoppingList(null);
    setView("all"); 
  };

  const fetchShoppingList = (recipeId) => {
    fetch(`http://localhost:5182/api/ShoppingLists/from-recipe/${recipeId}`)
      .then(res => res.json())
      .then(data => setShoppingList(data))
      .catch(err => console.error(err));
  };

  const deleteRecipe = (id) => {
    if (!window.confirm("Сигурен ли си, че искаш да изтриеш тази рецепта завинаги?")) return;
    fetch(`http://localhost:5182/api/Recipes/${id}?userId=${currentUser.id}`, { method: 'DELETE' })
    .then(res => {
      if (res.ok) {
        setRecipes(prev => prev.filter(r => r.id !== id));
        setShoppingList(null); 
      } else { alert("Грешка при триене."); }
    });
  };

  const toggleFavorite = (recipeId) => {
    fetch(`http://localhost:5182/api/Recipes/${recipeId}/favorite?userId=${currentUser.id}`, {
      method: 'POST',
    })
    .then(async res => {
      const message = await res.text();
      if (res.ok) {
      
        // Ако сме в екран "Любими" и махнем рецепта, я скриваме веднага от екрана
        if (view === "favorites") {
            setRecipes(prev => prev.filter(r => r.id !== recipeId));
        } else {
            // Ако сме във "Всички", само показваме съобщение
            alert(message);
        }
      } else {
        alert("Грешка: " + message);
      }
    })
    .catch(err => console.error(err));
  };

  //RENDERING

  if (!currentUser) {
    return (
      <div style={{ fontFamily: "Arial, sans-serif" }}>
        <h1 style={{ textAlign: "center", marginTop: "50px" }}>👨‍🍳 Recipe Builder</h1>
        <AuthForm onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #ccc", paddingBottom: "10px" }}>
        <div>
            <h1 style={{ margin: 0, display: "inline-block", marginRight: "20px" }}>👨‍🍳 Здравей, {currentUser.username}!</h1>
        </div>
        
        <button 
          onClick={handleLogout} 
          style={{ background: "#6c757d", color: "white", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer" }}
        >
          🚪 Изход
        </button>
      </div>

      {/*НАВИГАЦИЯ (Табове) */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <button 
            onClick={() => setView("all")}
            style={{ 
                padding: "10px 20px", cursor: "pointer", border: "none", borderRadius: "5px", fontSize: "16px",
                background: view === "all" ? "#007bff" : "#e9ecef", 
                color: view === "all" ? "white" : "black",
                fontWeight: view === "all" ? "bold" : "normal"
            }}
        >
            🌍 Всички Рецепти
        </button>

        <button 
            onClick={() => setView("favorites")}
            style={{ 
                padding: "10px 20px", cursor: "pointer", border: "none", borderRadius: "5px", fontSize: "16px",
                background: view === "favorites" ? "#ffc107" : "#e9ecef", 
                color: "black",
                fontWeight: view === "favorites" ? "bold" : "normal"
            }}
        >
            ❤️ Моите Любими
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
        
        {/* ЛЯВА КОЛОНА: Формите ги показваме САМО ако сме в режим "Всички" */}
        {view === "all" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <IngredientForm onIngredientAdded={() => setIngredientsRefreshTrigger(prev => prev + 1)} />
                <RecipeForm 
                    onRecipeCreated={fetchAllRecipes} 
                    refreshTrigger={ingredientsRefreshTrigger}
                    currentUser={currentUser} 
                />
            </div>
        ) : (
            
            <div style={{ padding: "20px", background: "#fff3cd", borderRadius: "8px", border: "1px solid #ffeeba", height: "fit-content" }}>
                <h3>👋 Твоята колекция</h3>
                <p>Тук са рецептите, които си харесал от други потребители.</p>
                <p>Можеш да си направиш списък за пазаруване от тях или да ги премахнеш, ако вече не ти трябват.</p>
            </div>
        )}

        {/* ДЯСНА КОЛОНА: Списък с рецепти */}
        <div>
           <div style={{ marginBottom: "30px" }}>
              <h2>
                  {view === "all" ? "🍲 Всички Рецепти" : "❤️ Любими Рецепти"}
              </h2>
              
              {recipes.length === 0 && <p style={{color: "#888"}}>Няма намерени рецепти.</p>}
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {recipes.map(recipe => (
                  <div key={recipe.id} style={{ border: "1px solid #ccc", padding: "10px", borderRadius: "8px", background: "#f9f9f9", position: "relative" }}>
                    <h3 style={{ margin: "0 0 5px 0", fontSize: "16px" }}>{recipe.title}</h3>
                    
                    <p style={{ fontSize: "11px", color: "#666", margin: "0 0 5px 0" }}>
                        👤 Автор: {recipe.user ? recipe.user.username : "Анонимен"}
                    </p>

                    <p style={{ fontSize: "12px", color: "#555" }}>⏳ {recipe.cookingTimeMinutes} мин.</p>
                    
                    <div style={{ display: "flex", gap: "5px", marginTop: "10px" }}>
                      <button 
                        onClick={() => fetchShoppingList(recipe.id)}
                        style={{ flex: 1, background: "#007bff", color: "white", border: "none", padding: "5px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                      >
                        🛒 Списък
                      </button>

                      {/* БУТОН ЗА ЛЮБИМИ / ПРЕМАХВАНЕ */}
                      {/* Ако съм във "Всички" и рецептата не е моя -> показвам сърце */}
                      {view === "all" && recipe.userId !== currentUser.id && (
                          <button 
                            onClick={() => toggleFavorite(recipe.id)}
                            style={{ background: "#ffc107", color: "black", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}
                            title="Добави в Любими"
                          >
                            ❤️
                          </button>
                      )}

                      {/* Ако съм в "Любими" -> показвам счупено сърце за махане */}
                      {view === "favorites" && (
                          <button 
                            onClick={() => toggleFavorite(recipe.id)}
                            style={{ background: "#ffcd39", color: "black", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}
                            title="Премахни от Любими"
                          >
                            💔 Махни
                          </button>
                      )}

                      {/* ТРИЕНЕ (Само за моите във "Всички") */}
                      {view === "all" && recipe.userId === currentUser.id && (
                        <button 
                            onClick={() => deleteRecipe(recipe.id)}
                            style={{ background: "#dc3545", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}
                            title="Изтрий завинаги"
                        >
                            🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
           </div>

           {/* СПИСЪК ЗА ПАЗАРУВАНЕ */}
           {shoppingList && (
             <div style={{ border: "2px solid #28a745", padding: "15px", borderRadius: "8px", background: "#eaffea", position: "sticky", top: "20px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h3 style={{ marginTop: 0 }}>🛒 {shoppingList.recipeName}</h3>
                    <button onClick={() => setShoppingList(null)} style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#666" }}>✖️</button>
                </div>

                <ul style={{ paddingLeft: "20px" }}>
                  {shoppingList.items.map((item, index) => (
                    <li key={index} style={{ marginBottom: "5px" }}>
                      <input type="checkbox" style={{ marginRight: "8px" }} />
                      {item.name} — <b>{item.quantity} {item.unit}</b>
                    </li>
                  ))}
                </ul>
                <hr style={{ borderColor: "#28a745", opacity: 0.3 }} />
                <h3 style={{ textAlign: "right", margin: "10px 0 15px 0" }}>Общо: {shoppingList.totalPrice.toFixed(2)} лв.</h3>

                <button 
                    onClick={() => setShoppingList(null)}
                    style={{ width: "100%", background: "#28a745", color: "white", border: "none", padding: "10px", borderRadius: "5px", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}
                >
                    ✅ Готово / Изчисти
                </button>
             </div>
           )}
        </div>

      </div>
    </div>
  )
}

export default App