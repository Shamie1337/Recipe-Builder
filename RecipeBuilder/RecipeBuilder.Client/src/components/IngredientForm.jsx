import { useState } from "react";

export default function IngredientForm({ onIngredientAdded }) {
  // Данни за формата
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  
  // Данни за търсачката на Open Food Facts
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Функция за търсене в Open Food Facts
  const searchOpenFoodFacts = () => {
    if (!searchQuery) return;
    
    setIsSearching(true);
    // публичен URL на API-то. 
   
    fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${searchQuery}&search_simple=1&action=process&json=1`)
      .then(res => res.json())
      .then(data => {
        // API-то връща масив "products".
        setSearchResults(data.products || []);
        setIsSearching(false);
      })
      .catch(err => {
        console.error(err);
        setIsSearching(false);
      });
  };

 
  const selectProduct = (product) => {
    // Взима името (ако го няма, ползва generic име)
    const productName = product.product_name || "Неизвестен продукт";
    setName(productName);
    
    
    setSearchResults([]);
    setSearchQuery("");
  };


  const handleSubmit = (e) => {
    e.preventDefault();

    const newIngredient = {
      name: name,
      estPrice: parseFloat(price)
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
      alert(`Продуктът "${name}" е добавен!`);
      setName("");
      setPrice("");
      if (onIngredientAdded) onIngredientAdded();
    })
    .catch(err => alert(err.message));
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "8px", background: "#fff" }}>
      <h3 style={{ marginTop: 0 }}>🌍 Внеси от Open Food Facts</h3>
      
      
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <input 
          type="text" 
          placeholder="Напр. Nutella, Barilla..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: "5px" }}
          
          onKeyDown={e => e.key === 'Enter' && searchOpenFoodFacts()}
        />
        <button 
          type="button" 
          onClick={searchOpenFoodFacts}
          disabled={isSearching}
          style={{ cursor: "pointer", background: "#ff9800", color: "white", border: "none", borderRadius: "4px", padding: "0 15px" }}
        >
          {isSearching ? "..." : "🔍"}
        </button>
      </div>

 
      {searchResults.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 15px 0", border: "1px solid #eee", maxHeight: "150px", overflowY: "auto" }}>
          {searchResults.map((product) => (
            <li 
              key={product._id} 
              onClick={() => selectProduct(product)}
              style={{ padding: "8px", borderBottom: "1px solid #eee", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
              onMouseOver={e => e.currentTarget.style.background = "#f0f0f0"}
              onMouseOut={e => e.currentTarget.style.background = "white"}
            >
              {/* Ако има картинка, я показваме малка */}
              {product.image_small_url && (
                <img src={product.image_small_url} alt="" style={{width: "30px", height: "30px", objectFit: "contain"}} />
              )}
              <span style={{ fontSize: "12px" }}>
                {product.product_name} <span style={{color: "#888"}}>({product.brands})</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <hr style={{margin: "15px 0", borderTop: "1px dashed #ccc"}} />

      <h3 style={{ marginTop: 0 }}>🥕 Добави в базата</h3>
      
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "12px", color: "#666" }}>Име:</label><br/>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
            placeholder="Име на продукта"
            style={{ width: "100%", padding: "5px" }}
          />
        </div>

        <div style={{ width: "80px" }}>
          <label style={{ fontSize: "12px", color: "#666" }}>Цена (лв):</label><br/>
          <input 
            type="number" 
            value={price} 
            onChange={e => setPrice(e.target.value)} 
            required 
            step="0.01"
            placeholder="0.00"
            style={{ width: "100%", padding: "5px" }}
          />
        </div>

        <button type="submit" style={{ padding: "7px 15px", background: "#28a745", color: "white", border: "none", cursor: "pointer", borderRadius: "4px" }}>
          + Запиши
        </button>
      </form>
    </div>
  );
}