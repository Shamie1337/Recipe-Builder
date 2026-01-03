import { useState, useEffect } from 'react'
import RecipeForm from './components/RecipeForm';
import IngredientForm from './components/IngredientForm';
import AuthForm from './components/AuthForm';
import "./App.css";


function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = localStorage.getItem("recipeAppUser");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [recipeToEdit, setRecipeToEdit] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [shoppingList, setShoppingList] = useState(null); 
  const [ingredientsRefreshTrigger, setIngredientsRefreshTrigger] = useState(0);
  const [view, setView] = useState("all"); 

  // --- API ---
  const fetchAllRecipes = () => {
    fetch('http://localhost:5182/api/Recipes')
      .then(res => res.json())
      .then(data => setRecipes(data))
      .catch(err => console.error(err));
  };

  const fetchFavoriteRecipes = () => {
    if (!currentUser) return;
    fetch(`http://localhost:5182/api/Recipes/my-favorites?userId=${currentUser.id}`)
      .then(res => res.json())
      .then(data => setRecipes(data))
      .catch(err => console.error(err));
  };
  
  useEffect(() => {
    if (currentUser) {
      if (view === "all") fetchAllRecipes();
      else fetchFavoriteRecipes();
    }
  }, [currentUser, view]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem("recipeAppUser", JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("recipeAppUser");
    setShoppingList(null);
    setView("all"); 
    setRecipeToEdit(null);
  };

  const fetchShoppingList = (recipeId) => {
    fetch(`http://localhost:5182/api/ShoppingLists/from-recipe/${recipeId}`)
      .then(res => res.json())
      .then(data => setShoppingList(data))
      .catch(err => console.error(err));
  };

  const deleteRecipe = (id) => {
    if (!window.confirm("Сигурен ли си?")) return;
    fetch(`http://localhost:5182/api/Recipes/${id}?userId=${currentUser.id}`, { method: 'DELETE' })
    .then(res => {
      if (res.ok) {
        setRecipes(prev => prev.filter(r => r.id !== id));
        setShoppingList(null);
        if (recipeToEdit && recipeToEdit.id === id) setRecipeToEdit(null);
      } else { alert("Грешка при триене."); }
    });
  };
  
  const toggleFavorite = (recipeId) => {
    fetch(`http://localhost:5182/api/Recipes/${recipeId}/favorite?userId=${currentUser.id}`, { method: 'POST' })
    .then(async res => {
      const message = await res.text();
      if (res.ok) {
        if (view === "favorites") setRecipes(prev => prev.filter(r => r.id !== recipeId));
        else alert(message);
      } else {
        alert("Грешка: " + message);
      }
    })
    .catch(err => console.error(err));
  };

  const startEditing = (recipe) => {
    setRecipeToEdit(recipe);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormSuccess = () => {
    fetchAllRecipes();
    setRecipeToEdit(null);
  };

  if (!currentUser) {
    return (
      <div className="app-container">
        <h1 style={{ textAlign: "center", marginTop: "50px" }}>👨‍🍳 Recipe Builder</h1>
        <AuthForm onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="app-container">
      
      {/* HEADER */}
      <div className="header">
        <h1 className="welcome-msg">👨‍🍳 Здравей, {currentUser.username}!</h1>
        <button onClick={handleLogout} className="logout-btn">🚪 Изход</button>
      </div>

      {/* NAV */}
      <div className="nav-tabs">
        <button 
            onClick={() => { setView("all"); setRecipeToEdit(null); }} 
            className={`tab-btn ${view === "all" ? "active" : ""}`}
        >
            🌍 Всички Рецепти
        </button>
        <button 
            onClick={() => { setView("favorites"); setRecipeToEdit(null); }} 
            className={`tab-btn ${view === "favorites" ? "active-fav" : ""}`}
        >
            ❤️ Моите Любими
        </button>
      </div>

      <div className="main-layout">
        
        {/* LEFT COLUMN */}
        {view === "all" ? (
            <div className="left-column">
                <IngredientForm onIngredientAdded={() => setIngredientsRefreshTrigger(prev => prev + 1)} />
                <RecipeForm 

                //React key trick to reset internal state when switching between edit/new --- IGNORE ---
                key={recipeToEdit ? recipeToEdit.id : 'new'}

                    onRecipeCreated={handleFormSuccess} 
                    refreshTrigger={ingredientsRefreshTrigger} 
                    currentUser={currentUser} 
                    recipeToEdit={recipeToEdit} 
                    onCancelEdit={() => setRecipeToEdit(null)} 
                />
            </div>
        ) : (
            <div className="collection-info">
                <h3>👋 Твоята колекция</h3>
                <p>Тук са рецептите, които си харесал от други потребители.</p>
            </div>
        )}

        {/* RIGHT COLUMN (LIST) */}
        <div>
           <div style={{ marginBottom: "30px" }}>
              <h2>{view === "all" ? "🍲 Всички Рецепти" : "❤️ Любими Рецепти"}</h2>
              {recipes.length === 0 && <p style={{color: "#888"}}>Няма намерени рецепти.</p>}
              
              <div className="recipe-grid">
                {recipes.map(recipe => {
                    // АГРЕСИВНА ЛОГИКА ЗА ID (Fix за бутоните)
                    let authorId = recipe.userId || recipe.UserId;
                    if (!authorId && recipe.user) authorId = recipe.user.id;
                    if (!authorId && recipe.User) authorId = recipe.User.Id;

                    // Сравняваме като текст, за да избегнем number vs string бъгове
                    const isOwner = String(authorId) === String(currentUser.id);
                    
                    const authorName = recipe.user?.username || recipe.User?.Username || "Анонимен";

                    return (
                      <div key={recipe.id} className="recipe-card">
                        <h3 className="card-title">{recipe.title}</h3>
                        <p className="card-author">👤 Автор: <strong>{authorName}</strong></p>
                        
                        {/* Използваме instructions, не description */}
                        <p className="card-instructions">{recipe.instructions}</p>
                        
                        <p className="card-meta">⏳ {recipe.cookingTimeMinutes} мин.</p>
                        
                        <div className="card-actions">
                          <button onClick={() => fetchShoppingList(recipe.id)} className="btn btn-blue">🛒 Списък</button>

                          {view === "all" && isOwner && (
                            <>
                                <button onClick={() => startEditing(recipe)} className="btn btn-orange" title="Редактирай">✏️</button>
                                <button onClick={() => deleteRecipe(recipe.id)} className="btn btn-red" title="Изтрий">🗑️</button>
                            </>
                          )}

                          {view === "all" && !isOwner && (
                              <button onClick={() => toggleFavorite(recipe.id)} className="btn btn-yellow" title="Добави в Любими">❤️</button>
                          )}

                          {view === "favorites" && (
                              <button onClick={() => toggleFavorite(recipe.id)} className="btn btn-yellow-dark" title="Премахни от Любими">💔 Махни</button>
                          )}
                        </div>
                      </div>
                    )
                })}
              </div>
           </div>

           {/* SHOPPING LIST */}
           {shoppingList && (
             <div className="shopping-list">
                <div className="sl-header">
                    <h3 style={{ marginTop: 0 }}>🛒 {shoppingList.recipeName}</h3>
                    <button onClick={() => setShoppingList(null)} className="sl-close">✖️</button>
                </div>
                <ul style={{ paddingLeft: "20px" }}>
                  {shoppingList.items.map((item, index) => (
                    <li key={index} style={{ marginBottom: "5px" }}>
                      <input type="checkbox" style={{ marginRight: "8px" }} /> {item.name} — <b>{item.quantity} {item.unit}</b>
                    </li>
                  ))}
                </ul>
                <hr style={{ borderColor: "#28a745", opacity: 0.3 }} />
                <h3 style={{ textAlign: "right", margin: "10px 0 15px 0" }}>Общо: {shoppingList.totalPrice.toFixed(2)} лв.</h3>
                <button onClick={() => setShoppingList(null)} className="sl-btn">✅ Готово / Изчисти</button>
             </div>
           )}
        </div>
      </div>
    </div>
  )
}

export default App