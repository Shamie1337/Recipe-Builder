import React from 'react';
import './RecipeDetailsModal.css';

const calculateNutrient = (per100g, qty, unit) => {
    const value = per100g || 0;
    const quantity = parseFloat(qty) || 0;

    // Ако е в грамове (g) или милилитри (ml)
    if (unit === 'g' || unit === 'ml') {
        return (value / 100) * quantity;
    }
    // Ако е в килограми (kg) или литри (l) -> 1кг = 1000г
    if (unit === 'kg' || unit === 'l') {
        return value * (quantity * 10); 
    }
    // Ако е бройка (br), приемаме че просто връщаме стойността умножена по бройката
    return value * quantity; 
};

export default function RecipeDetailsModal({ recipe, onClose }) {
    if (!recipe) return null;

    // Сумираме всички съставки
    const totalStats = recipe.recipeIngredients.reduce((acc, item) => {
        const ing = item.ingredient || {}; 
        
        acc.kcal += calculateNutrient(ing.caloriesPer100g, item.quantity, item.unit);
        acc.protein += calculateNutrient(ing.proteinsPer100g, item.quantity, item.unit);
        acc.carbs += calculateNutrient(ing.carbsPer100g, item.quantity, item.unit);
        acc.fats += calculateNutrient(ing.fatsPer100g, item.quantity, item.unit);
        return acc;
    }, { kcal: 0, protein: 0, carbs: 0, fats: 0 });

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                
                {/* ЗАГЛАВИЕ */}
                <div className="modal-header">
                    <h2 style={{margin:0}}>🍲 {recipe.title}</h2>
                    <button className="close-modal-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    
                    {/* ОБОБЩЕНИЕ (TOTALS) */}
                    <div className="nutrition-summary">
                        <div className="nutri-box">
                            <span className="nutri-val" style={{color: '#ef4444'}}>
                                {totalStats.kcal.toFixed(0)}
                            </span>
                            <span className="nutri-lbl">Kcal</span>
                        </div>
                        <div className="nutri-box">
                            <span className="nutri-val" style={{color: '#3b82f6'}}>
                                {totalStats.protein.toFixed(1)}g
                            </span>
                            <span className="nutri-lbl">Протеин</span>
                        </div>
                        <div className="nutri-box">
                            <span className="nutri-val" style={{color: '#f59e0b'}}>
                                {totalStats.carbs.toFixed(1)}g
                            </span>
                            <span className="nutri-lbl">Въглен</span>
                        </div>
                        <div className="nutri-box">
                            <span className="nutri-val" style={{color: '#8b5cf6'}}>
                                {totalStats.fats.toFixed(1)}g
                            </span>
                            <span className="nutri-lbl">Мазнини</span>
                        </div>
                    </div>

                    {/* ТАБЛИЦА СЪС СЪСТАВКИ */}
                    <h3 style={{fontSize: '1.1rem', marginBottom: '10px'}}>🛒 Съставки и Нутриенти</h3>
                    <table className="details-table">
                        <thead>
                            <tr>
                                <th>Продукт</th>
                                <th>Кол.</th>
                                <th>Kcal</th>
                                <th>Prot</th>
                                <th>Carb</th>
                                <th>Fat</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recipe.recipeIngredients.map((ri, index) => {
                                const ing = ri.ingredient || {};
                                return (
                                    <tr key={index}>
                                        <td>{ing.name}</td>
                                        <td>{ri.quantity} {ri.unit}</td>
                                        <td style={{fontWeight:'bold', color:'#ef4444'}}>
                                            {calculateNutrient(ing.caloriesPer100g, ri.quantity, ri.unit).toFixed(0)}
                                        </td>
                                        <td>{calculateNutrient(ing.proteinsPer100g, ri.quantity, ri.unit).toFixed(1)}</td>
                                        <td>{calculateNutrient(ing.carbsPer100g, ri.quantity, ri.unit).toFixed(1)}</td>
                                        <td>{calculateNutrient(ing.fatsPer100g, ri.quantity, ri.unit).toFixed(1)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* ИНСТРУКЦИИ */}
                    <h3 style={{fontSize: '1.1rem', marginBottom: '10px'}}>📝 Начин на приготвяне</h3>
                    <div style={{background: '#f8fafc', padding: '15px', borderRadius: '8px', lineHeight: '1.6'}}>
                        {recipe.instructions || "Няма въведени инструкции."}
                    </div>

                </div>
            </div>
        </div>
    );
}