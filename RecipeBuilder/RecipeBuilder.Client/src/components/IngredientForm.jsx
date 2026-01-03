import { useState } from "react";
import "./IngredientForm.css";

export default function IngredientForm({ onIngredientAdded }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchOpenFoodFacts = () => {
    if (!searchQuery) return;
    setIsSearching(true);
   
    fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${searchQuery}&search_simple=1&action=process&json=1`)
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
 
  const selectProduct = (product) => {
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
    <div className="ingredient-container">
      <h3 className="ing-title">🌍 Внеси от Open Food Facts</h3>
      
      <div className="search-bar">
        <input 
          className="search-input"
          type="text" 
          placeholder="Напр. Nutella, Barilla..."
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
              key={product._id} 
              className="result-item"
              onClick={() => selectProduct(product)}
            >
              {product.image_small_url && (
                <img src={product.image_small_url} alt="" className="small-img" />
              )}
              <span style={{ fontSize: "12px" }}>
                {product.product_name} <span style={{color: "#888"}}>({product.brands})</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <hr style={{margin: "15px 0", borderTop: "1px dashed #ccc"}} />

      <h3 className="ing-title">🥕 Добави в базата</h3>
      
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

        <div className="form-group" style={{ width: "80px" }}>
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
    </div>
  );
}