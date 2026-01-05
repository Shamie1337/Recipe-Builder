import { useState, useEffect } from "react";
import "./IngredientForm.css";

export default function IngredientForm({ onIngredientAdded }) {
  // Видими полета за формата
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  // Скрити данни (Ако сме избрали продукт от Open Food Facts)
  const [nutritionData, setNutritionData] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    barcode: null
  });
  
  // State за търсенето
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Списък на всички продукти в базата (за да можем да трием старите)
  const [allIngredients, setAllIngredients] = useState([]);

  const fetchIngredients = () => {
    fetch("http://localhost:5182/api/Ingredients")
        .then(res => res.json())
        .then(data => setAllIngredients(data))
        .catch(err => console.error(err));
  };

  // Зареждане на всички продукти при стартиране
  useEffect(() => {
    fetchIngredients();
  }, []);

  // Функция за изтриване на продукт
  const handleDeleteIngredient = (id) => {
    if(!window.confirm("Сигурни ли сте, че искате да изтриете този продукт?")) return;

    fetch(`http://localhost:5182/api/Ingredients/${id}`, {
        method: 'DELETE'
    })
    .then(res => {
        if (res.ok) {
            // Махаме го от локалния списък веднага
            setAllIngredients(prev => prev.filter(ing => ing.id !== id));
            // Уведомяваме родителя, ако трябва да презареди нещо
            if (onIngredientAdded) onIngredientAdded();
        } else {
            alert("Не може да се изтрие (може би се използва в рецепта).");
        }
    })
    .catch(err => console.error(err));
  };

  // 1. Търсене директно от Frontend-а
  const searchOpenFoodFacts = () => {
    if (!searchQuery) return;
    setIsSearching(true);
   
    fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${searchQuery}&search_simple=1&action=process&json=1&page_size=10`)
      .then(res => res.json())
      .then(data => {
        setSearchResults(data.products || []);
        setIsSearching(false);
      })
      .catch(err => {
        console.error(err);
        setIsSearching(false);
      });
  };
 
  // 2. Когато избереш продукт от списъка
  const selectProduct = (product) => {
    const productName = product.product_name || "Неизвестен продукт";
    setName(productName);

    const nutriments = product.nutriments || {};
    setNutritionData({
        calories: nutriments["energy-kcal_100g"] || 0,
        protein: nutriments["proteins_100g"] || 0,
        carbs: nutriments["carbohydrates_100g"] || 0,
        fat: nutriments["fat_100g"] || 0,
        barcode: product.code
    });

    setSearchResults([]);
    setSearchQuery("");
  };

  // 3. Записване в базата
  const handleSubmit = (e) => {
    e.preventDefault();

    const newIngredient = {
      name: name,
      estPrice: parseFloat(price),
      caloriesPer100g: nutritionData.calories,
      proteinsPer100g: nutritionData.protein,
      carbsPer100g: nutritionData.carbs,
      fatsPer100g: nutritionData.fat,
      barcode: nutritionData.barcode
    };

    fetch("http://localhost:5182/api/Ingredients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newIngredient)
    })
    .then(res => {
      if (!res.ok) throw new Error("Грешка при запис!");
      return res.json();
    })
    .then(() => {
      const infoMsg = nutritionData.calories > 0 
        ? `✅ Добавен: ${name}\n Калории: ${nutritionData.calories} kcal`
        : `✅ Добавен ръчно: ${name}`;
      
      alert(infoMsg);

      setName("");
      setPrice("");
      setNutritionData({ calories: 0, protein: 0, carbs: 0, fat: 0, barcode: null });
      
      // Обновяваме списъка отдолу, за да видим новия продукт веднага
      fetchIngredients();
      
      if (onIngredientAdded) onIngredientAdded();
    })
    .catch(err => alert(err.message));
  };

  return (
    <div className="ingredient-container">
      <h3 className="ing-title">🌍 Търси в Open Food Facts</h3>
      
      <div className="search-bar">
        <input 
          className="search-input"
          type="text" 
          placeholder="Напр. Nutella, Barilla, Ориз..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && searchOpenFoodFacts()}
        />
        <button 
          type="button" 
          className="search-btn"
          onClick={searchOpenFoodFacts}
          disabled={isSearching}
        >
          {isSearching ? "..." : "🔍"}
        </button>
      </div>

      {searchResults.length > 0 && (
        <ul className="results-list">
          {searchResults.map((product) => (
            <li 
              key={product._id || product.code} 
              className="result-item"
              onClick={() => selectProduct(product)}
            >
              {product.image_small_url ? (
                <img src={product.image_small_url} alt="" className="small-img" />
              ) : (
                <span className="small-img">🍎</span>
              )}
              <div style={{display:'flex', flexDirection:'column'}}>
                 <span style={{ fontSize: "13px", fontWeight: "bold" }}>
                    {product.product_name}
                 </span>
                 <span style={{ fontSize: "11px", color: "#888" }}>
                    {product.brands}
                 </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <hr style={{margin: "15px 0", borderTop: "1px dashed #ccc"}} />

      <h3 className="ing-title">🥕 Данни за продукта</h3>
      
      {nutritionData.calories > 0 && (
        <div style={{
            marginBottom: '8px', 
            fontSize: '0.8rem', 
            color: '#856404', 
            background: '#fff3cd', 
            padding: '6px 10px', 
            borderRadius: '4px',
            border: '1px solid #ffeeba',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        }}>
            <span>🔥 Избран: <b>{nutritionData.calories} kcal</b> /100g</span>
            <span style={{cursor:'pointer'}} onClick={() => setNutritionData({calories:0})} title="Премахни">✖</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="add-manual-form">
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Име:</label>
          <input 
            className="search-input"
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
            placeholder="Име на продукта"
          />
        </div>

        <div className="form-group" style={{ width: "100px" }}>
          <label className="form-label">Цена (лв):</label>
          <input 
            className="search-input"
            type="number" 
            value={price} 
            onChange={e => setPrice(e.target.value)} 
            required 
            step="0.01"
            placeholder="0.00"
          />
        </div>

        <button type="submit" className="save-ing-btn">
          + Запиши
        </button>
      </form>

      {/* СПИСЪК ЗА ТРИЕНЕ */}
      <hr style={{margin: "25px 0 15px 0", borderTop: "1px dashed #ccc"}} />
      <h3 className="ing-title" style={{fontSize:'1rem', color:'#666'}}>📋 Налични продукти (База)</h3>
      
      <div style={{maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '4px'}}>
         {allIngredients.length === 0 ? (
             <p style={{padding:'10px', fontSize:'0.9rem', color:'#999'}}>Няма продукти.</p>
         ) : (
             <ul style={{listStyle:'none', padding:0, margin:0}}>
                 {allIngredients.map(ing => (
                     <li key={ing.id} style={{
                         padding: '8px 10px', 
                         borderBottom: '1px solid #f5f5f5', 
                         display:'flex', 
                         justifyContent:'space-between',
                         alignItems:'center',
                         fontSize: '0.9rem'
                     }}>
                        <div>
                            <span>{ing.name}</span>

                            {ing.caloriesPer100g > 0 ? (
                                <span style={{marginLeft:'5px', fontSize:'0.75rem', color:'#e67e22'}}></span>
                            ) : (
                                <span style={{marginLeft:'5px', fontSize:'0.75rem', color:'#999'}}></span>
                            )}
                        </div>
                        
                        <button 
                            onClick={() => handleDeleteIngredient(ing.id)}
                            style={{
                                background: '#fee2e2', 
                                color: '#dc2626', 
                                border:'none', 
                                borderRadius:'4px', 
                                padding:'3px 8px', 
                                cursor:'pointer',
                                fontSize:'0.8rem'
                            }}
                            title="Изтрий от базата"
                        >
                            🗑️
                        </button>
                     </li>
                 ))}
             </ul>
         )}
      </div>
    </div>
  );
}