import { useState, useEffect } from 'react'
import RecipeForm from './components/RecipeForm';
import IngredientForm from './components/IngredientForm';
import AuthForm from './components/AuthForm'; 
function App() {
  
  const [currentUser, setCurrentUser] = useState(null);

  const [recipes, setRecipes] = useState([]);
  const [shoppingList, setShoppingList] = useState(null); 
  const [ingredientsRefreshTrigger, setIngredientsRefreshTrigger] = useState(0);

 
  const fetchRecipes = () => {
    fetch('http://localhost:5182/api/Recipes')
      .then(res => res.json())
      .then(data => setRecipes(data))
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
    fetch(`http://localhost:5182/api/Recipes/${id}`, { method: 'DELETE' })
    .then(res => {
      if (res.ok) {
        setRecipes(prev => prev.filter(r => r.id !== id));
        setShoppingList(null); 
      }
    })
    .catch(err => console.error(err));
  };


  useEffect(() => {
    if (currentUser) {
      fetchRecipes();
    }
  }, [currentUser]);

  // --- Рендериране (Какво да покажем на екрана) ---

  // СЦЕНАРИЙ 1: Потребителят НЕ е влязъл (Показваме формата за вход/регистрация)
  if (!currentUser) {
    return (
      <div style={{ fontFamily: "Arial, sans-serif" }}>
        <h1 style={{ textAlign: "center", marginTop: "50px" }}>👨‍🍳 Recipe Builder</h1>
        {/* Показваме само формата за вход/регистрация */}
        <AuthForm onLogin={(user) => setCurrentUser(user)} />
      </div>
    );
  }

  // СЦЕНАРИЙ 2: Потребителят Е влязъл (Показваме основното приложение)
  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #ccc", paddingBottom: "10px" }}>
        <h1 style={{ margin: 0 }}>👨‍🍳 Здравей, {currentUser.username}!</h1>
        <button 
          onClick={() => setCurrentUser(null)} // Изход = правим user на null
          style={{ background: "#6c757d", color: "white", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer" }}
        >
          🚪 Изход
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
        
        
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <IngredientForm onIngredientAdded={() => setIngredientsRefreshTrigger(prev => prev + 1)} />
          <RecipeForm onRecipeCreated={fetchRecipes} refreshTrigger={ingredientsRefreshTrigger} />
        </div>

       
        <div>
           <div style={{ marginBottom: "30px" }}>
              <h2>🍲 Всички Рецепти</h2>
              {recipes.length === 0 && <p style={{color: "#888"}}>Няма рецепти.</p>}
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {recipes.map(recipe => (
                  <div key={recipe.id} style={{ border: "1px solid #ccc", padding: "10px", borderRadius: "8px", background: "#f9f9f9" }}>
                    <h3 style={{ margin: "0 0 5px 0", fontSize: "16px" }}>{recipe.title}</h3>
                    <p style={{ fontSize: "12px", color: "#555" }}>⏳ {recipe.cookingTimeMinutes} мин.</p>
                    
                    <div style={{ display: "flex", gap: "5px", marginTop: "10px" }}>
                      <button 
                        onClick={() => fetchShoppingList(recipe.id)}
                        style={{ flex: 1, background: "#007bff", color: "white", border: "none", padding: "5px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                      >
                        🛒 Списък
                      </button>
                      <button 
                        onClick={() => deleteRecipe(recipe.id)}
                        style={{ background: "#dc3545", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
           </div>

           {shoppingList && (
             <div style={{ border: "2px solid #28a745", padding: "15px", borderRadius: "8px", background: "#eaffea", position: "sticky", top: "20px" }}>
                <h3 style={{ marginTop: 0 }}>🛒 {shoppingList.recipeName}</h3>
                <ul style={{ paddingLeft: "20px" }}>
                  {shoppingList.items.map((item, index) => (
                    <li key={index}>
                      {item.name} — <b>{item.quantity} {item.unit}</b>
                    </li>
                  ))}
                </ul>
                <h3 style={{ textAlign: "right", margin: "10px 0 0 0" }}>Общо: {shoppingList.totalPrice.toFixed(2)} лв.</h3>
             </div>
           )}
        </div>

      </div>
    </div>
  )
}

export default App