import { useState, useEffect } from 'react'
import RecipeForm from './components/RecipeForm'; 

function App() {
  const [recipes, setRecipes] = useState([]);
  const [shoppingList, setShoppingList] = useState(null); 

  
  const fetchRecipes = () => {
    fetch('http://localhost:5182/api/Recipes')
      .then(res => res.json())
      .then(data => setRecipes(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchShoppingList = (recipeId) => {
    fetch(`http://localhost:5182/api/ShoppingLists/from-recipe/${recipeId}`)
      .then(res => res.json())
      .then(data => setShoppingList(data))
      .catch(err => console.error(err));
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center" }}>👨‍🍳 Recipe Builder</h1>
      <hr />

      
      <RecipeForm onRecipeCreated={fetchRecipes} />

      <div style={{ display: 'grid', gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "40px" }}>
        

        <div>
          <h2>🍲 Налични Рецепти</h2>
          {recipes.map(recipe => (
            <div key={recipe.id} style={{ border: "1px solid #ccc", padding: "15px", marginBottom: "10px", borderRadius: "8px", background: "#f9f9f9" }}>
              <h3 style={{ margin: "0 0 5px 0" }}>{recipe.title}</h3>
              <p style={{ fontSize: "14px", color: "#555" }}>⏳ {recipe.cookingTimeMinutes} мин.</p>
              
              <button 
                onClick={() => fetchShoppingList(recipe.id)}
                style={{ background: "#007bff", color: "white", border: "none", padding: "8px 12px", borderRadius: "4px", cursor: "pointer" }}
              >
                🛒 Генерирай списък
              </button>
            </div>
          ))}
        </div>

        
        <div>
          <h2>📝 Списък за пазаруване</h2>
          {!shoppingList ? (
            <p style={{ color: "#777" }}>Избери рецепта, за да видиш продуктите.</p>
          ) : (
            <div style={{ border: "2px solid #28a745", padding: "20px", borderRadius: "8px", background: "#eaffea", position: "sticky", top: "20px" }}>
              <h3 style={{ marginTop: 0 }}>За: {shoppingList.recipeName}</h3>
              <ul style={{ paddingLeft: "20px" }}>
                {shoppingList.items.map((item, index) => (
                  <li key={index} style={{ marginBottom: "5px" }}>
                    {item.name} — <b>{item.quantity} {item.unit}</b> <span style={{color: "#666"}}>({item.estimatedPrice.toFixed(2)} лв.)</span>
                  </li>
                ))}
              </ul>
              <hr />
              <h3 style={{ textAlign: "right" }}>Общо: {shoppingList.totalPrice.toFixed(2)} лв.</h3>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default App