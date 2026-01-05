import { useState, useEffect } from 'react'
import RecipeForm from './components/RecipeForm';
import IngredientForm from './components/IngredientForm';
import AuthForm from './components/AuthForm';
import RecipeDetailsModal from './components/RecipeDetailsModal'; // <--- НОВО
import "./App.css";

// --- Логика за цената ---
const calculateRealPrice = (basePrice, quantity, unit) => {
  if (!basePrice || !quantity) return 0;
  const price = parseFloat(basePrice);
  const qty = parseFloat(quantity);

  if (unit === "g" || unit === "ml") {
      return (price / 1000) * qty;
  }
  return price * qty;
};

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

  
  const [selectedRecipeDetails, setSelectedRecipeDetails] = useState(null);

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

  const handleDeleteAccount = () => {
    const confirmDelete = window.confirm(
        "ВНИМАНИЕ: Сигурни ли сте, че искате да изтриете профила си?\n\nТова ще изтрие всички ваши рецепти и данни безвъзвратно!"
    );

    if (!confirmDelete) return;

    fetch(`http://localhost:5182/api/Auth/${currentUser.id}`, {
        method: 'DELETE'
    })
    .then(res => {
        if (res.ok) {
            alert("Профилът ви беше изтрит успешно.");
            handleLogout(); 
        } else {
            alert("Възникна грешка при изтриването.");
        }
    })
    .catch(err => console.error(err));
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
      <div className="app-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
         <div style={{width: '100%'}}>
            <h1 style={{ textAlign: "center", marginBottom: "30px", fontSize: "2.5rem" }}>👨‍🍳 Recipe Builder</h1>
            <AuthForm onLogin={handleLogin} />
         </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      
      {/* HEADER */}
      <div className="header">
        <h1 className="welcome-msg">👨‍🍳 Здравей, {currentUser.username}!</h1>
        
        <div style={{ display: 'flex', gap: '10px' }}>
            <button 
                onClick={handleDeleteAccount} 
                className="delete-account-btn"
                title="Изтрий профила си завинаги"
            >
                🗑️ Изтрий Профил
            </button>

            <button onClick={handleLogout} className="logout-btn">🚪 Изход</button>
        </div>
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
                    key={recipeToEdit ? recipeToEdit.id : 'new'}
                    onRecipeCreated={handleFormSuccess} 
                    refreshTrigger={ingredientsRefreshTrigger} 
                    currentUser={currentUser} 
                    recipeToEdit={recipeToEdit} 
                    onCancelEdit={() => setRecipeToEdit(null)} 
                />
            </div>
        ) : (
            <div className="collection-info" style={{ padding: '20px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fcd34d' }}>
                <h3 style={{marginTop: 0, color: '#b45309'}}>👋 Твоята колекция</h3>
                <p style={{marginBottom: 0, color: '#78350f'}}>Тук са рецептите, които си харесал и искаш да сготвиш по-късно.</p>
            </div>
        )}

        {/* RIGHT COLUMN (LIST) */}
        <div>
           <div style={{ marginBottom: "30px" }}>
              <h2>{view === "all" ? "🍲 Всички Рецепти" : "❤️ Любими Рецепти"}</h2>
              {recipes.length === 0 && <p style={{color: "#888"}}>Няма намерени рецепти.</p>}
              
              <div className="recipe-grid">
                {recipes.map(recipe => {
                    let authorId = recipe.userId || recipe.UserId;
                    if (!authorId && recipe.user) authorId = recipe.user.id;
                    if (!authorId && recipe.User) authorId = recipe.User.Id;

                    const isOwner = String(authorId) === String(currentUser.id);
                    const authorName = recipe.user?.username || recipe.User?.Username || "Анонимен";

                    return (
                      <div key={recipe.id} className="recipe-card">
                        <h3 className="card-title">{recipe.title}</h3>
                        <p className="card-author">👤 Автор: <strong>{authorName}</strong></p>
                        
                        <p className="card-instructions">{recipe.instructions}</p>
                        
                        <div className="card-meta">⏳ {recipe.cookingTimeMinutes} мин.</div>
                        
                        <div className="card-actions">
                          <button onClick={() => fetchShoppingList(recipe.id)} className="btn btn-blue">🛒 Списък</button>
                          
                          {/* --- НОВО: Бутон за детайли --- */}
                          <button 
                                onClick={() => setSelectedRecipeDetails(recipe)} 
                                className="btn" 
                                style={{background: '#8b5cf6', color: 'white'}}
                                title="Виж нутриенти и инструкции"
                            >
                                ℹ️ Инфо
                          </button>

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
                    <button onClick={() => setShoppingList(null)} className="sl-close">✖</button>
                </div>
                <ul>
                  {shoppingList.items.map((item, index) => {
                    const itemPrice = calculateRealPrice(item.estPrice, item.quantity, item.unit);
                    return (
                        <li key={index}>
                          <div style={{display:'flex', alignItems:'center'}}>
                            <input type="checkbox" style={{ marginRight: "10px", width: "18px", height: "18px" }} /> 
                            <span>{item.name} — <b>{item.quantity} {item.unit}</b></span>
                          </div>
                          
                          {itemPrice > 0 && (
                              <span style={{color: "#10b981", fontWeight: "bold", marginLeft: 'auto'}}>
                                  {itemPrice.toFixed(2)} лв.
                              </span>
                          )}
                        </li>
                    );
                  })}
                </ul>
                <div style={{borderTop: '1px dashed #ccc', marginTop: '15px', paddingTop: '10px'}}></div>
                <h3 style={{ textAlign: "right", margin: "10px 0 15px 0", color: "#059669" }}>Общо: {shoppingList.totalPrice.toFixed(2)} лв.</h3>
                <button onClick={() => setShoppingList(null)} className="sl-btn">✅ Готово</button>
             </div>
           )}

           {/* --- НОВО: Модален прозорец за детайли (показва се само ако има избрана рецепта) --- */}
           {selectedRecipeDetails && (
              <RecipeDetailsModal 
                  recipe={selectedRecipeDetails} 
                  onClose={() => setSelectedRecipeDetails(null)} 
              />
           )}

        </div>
      </div>
    </div>
  )
}

export default App