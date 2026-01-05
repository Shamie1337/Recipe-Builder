import { useState, useEffect } from "react";
import "./RecipeForm.css";

const calculateItemPrice = (basePrice, qty, unit) => {
  if (!basePrice || !qty) return 0;
  const p = parseFloat(basePrice);
  const q = parseFloat(qty);

  if (unit === "g" || unit === "ml") return (p / 1000) * q;
  
  return p * q;
};

export default function RecipeForm({ onRecipeCreated, refreshTrigger, currentUser, recipeToEdit, onCancelEdit }) {
  const [allIngredients, setAllIngredients] = useState([]);
  
  

  const [title, setTitle] = useState(recipeToEdit ? recipeToEdit.title : "");
  
 
  const [instructions, setInstructions] = useState(recipeToEdit ? (recipeToEdit.instructions || "") : ""); 
  const [cookingTime, setCookingTime] = useState(recipeToEdit ? recipeToEdit.cookingTimeMinutes : 30);
  
  // Логика за съставките при старт
  const [selectedIngredients, setSelectedIngredients] = useState(() => {
    if (recipeToEdit && recipeToEdit.recipeIngredients && recipeToEdit.recipeIngredients.length > 0) {
      return recipeToEdit.recipeIngredients.map(i => ({
        ingredientId: i.ingredientId,
        quantity: i.quantity,
        unit: i.unit || "g"
      }));
    }
    return [{ ingredientId: "", quantity: 100, unit: "g" }];
  });

  
  useEffect(() => {
    fetch("http://localhost:5182/api/Ingredients") 
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

  const removeIngredientRow = (index) => {
    const updatedIngredients = selectedIngredients.filter((_, i) => i !== index);
    setSelectedIngredients(updatedIngredients);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert("Моля, влезте в профила си!");
      return;
    }

    const recipeData = {
      title,
      instructions: instructions,
      cookingTimeMinutes: parseInt(cookingTime),
      userId: currentUser.id,
      recipeIngredients: selectedIngredients
        .filter(i => i.ingredientId)
        .map(i => ({
          ingredientId: parseInt(i.ingredientId),
          quantity: parseFloat(i.quantity),
          unit: i.unit
        }))
    };

    if (recipeToEdit) {
      recipeData.id = recipeToEdit.id;
    }

    const url = recipeToEdit 
      ? `http://localhost:5182/api/Recipes/${recipeToEdit.id}?userId=${currentUser.id}`
      : "http://localhost:5182/api/Recipes";

    const method = recipeToEdit ? "PUT" : "POST";

    fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recipeData)
    })
    .then(res => {
      if (!res.ok) {
         return res.text().then(text => { throw new Error(text) });
      }
      if (res.status !== 204) return res.json(); 
      return {};
    })
    .then(() => {
      alert(recipeToEdit ? "Рецептата е обновена успешно!" : "Рецептата е създадена успешно! 🎉");
      // Няма нужда да чистим state-а ръчно, App.jsx ще го направи
      if(onRecipeCreated) onRecipeCreated();
    })
    .catch(err => alert(err.message));
  };

return (
    <form onSubmit={handleSubmit} className="recipe-form-container">
      <h2 className="recipe-form-title">
        {recipeToEdit ? "✏️ Редактирай Рецепта" : "➕ Нова Рецепта"}
      </h2>
      
      <div className="rf-group">
        <label className="rf-label">Заглавие:</label>
        <input 
          className="rf-input"
          type="text" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          required 
          placeholder="Напр. Домашна Пица"
        />
      </div>

      <div className="rf-group">
        <label className="rf-label">Инструкции:</label>
        <textarea 
          className="rf-textarea"
          value={instructions} 
          onChange={e => setInstructions(e.target.value)} 
          required 
          placeholder="Опиши стъпките тук..."
        />
      </div>

      <div className="rf-group">
        <label className="rf-label">Време за готвене (мин):</label>
        <input 
          className="rf-input"
          style={{width: '120px'}}
          type="number" 
          value={cookingTime} 
          onChange={e => setCookingTime(e.target.value)} 
        />
      </div>

      <div style={{ marginBottom: "15px", borderTop: "1px solid #eee", paddingTop: "15px" }}>
        <h3 className="ing-title" style={{border: 'none', marginBottom: '10px', fontSize: '1rem'}}>🛒 Съставки</h3>
        {selectedIngredients.map((row, index) => {
            const ingDetails = allIngredients.find(i => i.id === parseInt(row.ingredientId));
            const estimatedCost = ingDetails ? calculateItemPrice(ingDetails.estPrice, row.quantity, row.unit) : 0;
            const currentIngName = ingDetails ? ingDetails.name : "";

            return (
            <div key={index} className="ingredient-row" style={{ display: 'flex', alignItems: 'center' }}>
                
                <select 
                className="rf-select"
                value={row.ingredientId} 
                onChange={e => handleIngredientChange(index, 'ingredientId', e.target.value)}
                title={currentIngName}
                style={{ flex: "3", minWidth: "130px", textOverflow: "ellipsis" }}
                >
                <option value="">-- Продукт --</option>
                {allIngredients.map(ing => (
                    <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.estPrice} лв.)
                    </option>
                ))}
                </select>

                <input 
                className="rf-input"
                type="number" 
                placeholder="Кол." 
                value={row.quantity} 
                onChange={e => handleIngredientChange(index, 'quantity', e.target.value)}
                style={{ width: "70px", marginLeft: "5px" }}
                />
                
                <select
                    className="rf-select"
                    value={row.unit}
                    onChange={e => handleIngredientChange(index, 'unit', e.target.value)}
                    style={{ width: "70px", marginLeft: "5px" }}
                >
                    <option value="g">гр.</option>
                    <option value="kg">кг.</option>
                    <option value="ml">мл.</option>
                    <option value="l">л.</option>
                    <option value="br">бр.</option>
                </select>

                <div style={{ width: "80px", textAlign: "right", fontSize: "0.85rem", color: "#64748b", marginLeft: "5px" }}>
                    {estimatedCost > 0 ? `~${estimatedCost.toFixed(2)} лв.` : ""}
                </div>

                <button 
                type="button" 
                className="remove-btn"
                onClick={() => removeIngredientRow(index)}
                title="Премахни"
                style={{ marginLeft: "10px" }}
                >
                ✕
                </button>
            </div>
            );
        })}

        <button type="button" onClick={addIngredientRow} className="add-row-btn">
            + Добави още един продукт
        </button>
      </div>
      
      <div className="form-actions">
        <button type="submit" className={`submit-btn ${recipeToEdit ? 'btn-orange' : 'btn-green'}`}>
            {recipeToEdit ? "💾 Запази Промените" : "💾 Създай Рецепта"}
        </button>

        {recipeToEdit && (
            <button type="button" onClick={onCancelEdit} className="cancel-btn">
                Отказ
            </button>
        )}
      </div>
    </form>
  );
}