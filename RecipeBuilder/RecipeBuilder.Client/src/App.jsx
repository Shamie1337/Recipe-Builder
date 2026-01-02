import { useState, useEffect } from 'react'
import RecipeForm from './components/RecipeForm';
import IngredientForm from './components/IngredientForm';

function App() {
  const [recipes, setRecipes] = useState([]);
  const [shoppingList, setShoppingList] = useState(null); 
  
  // Тригър на обновяване
  const [ingredientsRefreshTrigger, setIngredientsRefreshTrigger] = useState(0);

  // Зарежда рецептите
  const fetchRecipes = () => {
    fetch('http://localhost:5182/api/Recipes') // Провери порта!
      .then(res => res.json())
      .then(data => setRecipes(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  // Генерира списък за пазаруване
  const fetchShoppingList = (recipeId) => {
    fetch(`http://localhost:5182/api/ShoppingLists/from-recipe/${recipeId}`)
      .then(res => res.json())
      .then(data => setShoppingList(data))
      .catch(err => console.error(err));
  };

  // Извиква се, когато новата форма IngredientForm добави успешно продукт
  const handleIngredientAdded = () => {
    setIngredientsRefreshTrigger(prev => prev + 1);
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center" }}>👨‍🍳 Recipe Builder</h1>
      <hr />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
        
       
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
       
          <IngredientForm onIngredientAdded={handleIngredientAdded} />

       
          <RecipeForm 
            onRecipeCreated={fetchRecipes} 
            refreshTrigger={ingredientsRefreshTrigger} 
          />

        </div>

      
        <div>
         
           <div style={{ marginBottom: "30px" }}>
              <h2>🍲 Налични Рецепти</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {recipes.map(recipe => (
                  <div key={recipe.id} style={{ border: "1px solid #ccc", padding: "10px", borderRadius: "8px", background: "#f9f9f9" }}>
                    <h3 style={{ margin: "0 0 5px 0", fontSize: "16px" }}>{recipe.title}</h3>
                    <p style={{ fontSize: "12px", color: "#555" }}>⏳ {recipe.cookingTimeMinutes} мин.</p>
                    <button 
                      onClick={() => fetchShoppingList(recipe.id)}
                      style={{ background: "#007bff", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", width: "100%" }}
                    >
                      🛒 Списък
                    </button>
                  </div>
                ))}
              </div>
           </div>

           
           {shoppingList && (
             <div style={{ border: "2px solid #28a745", padding: "15px", borderRadius: "8px", background: "#eaffea" }}>
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