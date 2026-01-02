import { useState, useEffect } from "react";


export default function RecipeForm({ onRecipeCreated, refreshTrigger }) {
  const [allIngredients, setAllIngredients] = useState([]);
  
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [cookingTime, setCookingTime] = useState(30);
  
  const [selectedIngredients, setSelectedIngredients] = useState([
    { ingredientId: "", quantity: 100, unit: "g" }
  ]);

  
  
  useEffect(() => {
    fetch("http://localhost:5182/api/Ingredients") // Провери порта!
      .then((res) => res.json())
      .then((data) => setAllIngredients(data))
      .catch((err) => console.error(err));
  }, [refreshTrigger]); 

  const addIngredientRow = () => {
    setSelectedIngredients([
      ...selectedIngredients,
      { ingredientId: "", quantity: 100, unit: "g" }
    ]);
  };

  const handleIngredientChange = (index, field, value) => {
    const updatedIngredients = [...selectedIngredients];
    updatedIngredients[index][field] = value;
    setSelectedIngredients(updatedIngredients);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newRecipe = {
      title,
      instructions,
      cookingTimeMinutes: parseInt(cookingTime),
      recipeIngredients: selectedIngredients
        .filter(i => i.ingredientId)
        .map(i => ({
          ingredientId: parseInt(i.ingredientId),
          quantity: parseFloat(i.quantity),
          unit: i.unit
        }))
    };

    fetch("http://localhost:5182/api/Recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRecipe)
    })
    .then(res => {
      if (!res.ok) throw new Error("Грешка при запис!");
      return res.json();
    })
    .then(() => {
      alert("Рецептата е създадена успешно! 🎉");
      setTitle("");
      setInstructions("");
      setSelectedIngredients([{ ingredientId: "", quantity: 100, unit: "g" }]);
      if(onRecipeCreated) onRecipeCreated();
    })
    .catch(err => alert(err.message));
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: "2px solid #007bff", padding: "20px", borderRadius: "8px", background: "#f0f8ff", marginBottom: "30px" }}>
      <h2 style={{marginTop: 0}}>➕ Нова Рецепта</h2>
      
      <div style={{ marginBottom: "10px" }}>
        <label>Заглавие:</label><br/>
        <input 
          type="text" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          required 
          style={{ width: "100%", padding: "5px" }}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>Инструкции:</label><br/>
        <textarea 
          value={instructions} 
          onChange={e => setInstructions(e.target.value)} 
          required 
          style={{ width: "100%", height: "60px", padding: "5px" }}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>Време (мин):</label>
        <input 
          type="number" 
          value={cookingTime} 
          onChange={e => setCookingTime(e.target.value)} 
          style={{ marginLeft: "10px", width: "60px" }}
        />
      </div>

      <h3>Съставки:</h3>
      {selectedIngredients.map((row, index) => (
        <div key={index} style={{ display: "flex", gap: "10px", marginBottom: "5px" }}>
          
          <select 
            value={row.ingredientId} 
            onChange={e => handleIngredientChange(index, 'ingredientId', e.target.value)}
            required
            style={{flex: 1}}
          >
            <option value="">-- Избери продукт --</option>
            {allIngredients.map(ing => (
              <option key={ing.id} value={ing.id}>{ing.name}</option>
            ))}
          </select>

          <input 
            type="number" 
            placeholder="Кол." 
            value={row.quantity} 
            onChange={e => handleIngredientChange(index, 'quantity', e.target.value)}
            style={{ width: "70px" }}
          />
          
          <input 
            type="text" 
            placeholder="Ед." 
            value={row.unit} 
            onChange={e => handleIngredientChange(index, 'unit', e.target.value)}
            style={{ width: "50px" }}
          />
        </div>
      ))}

      <button type="button" onClick={addIngredientRow} style={{ marginBottom: "15px", cursor: "pointer" }}>
        + Още един продукт
      </button>
      <br />
      
      <button type="submit" style={{ background: "green", color: "white", padding: "10px 20px", border: "none", cursor: "pointer", fontSize: "16px" }}>
        💾 Запази Рецептата
      </button>
    </form>
  );
}