import { useState } from "react";

export default function AuthForm({ onLogin }) {
  // true = Вход, false = Регистрация
  const [isLoginMode, setIsLoginMode] = useState(true);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState(""); // Само за регистрация

  const handleSubmit = (e) => {
    e.preventDefault();

    // URL-а според режима
    const endpoint = isLoginMode ? "login" : "register";
    
    // 2. Подготвяме данните
    const payload = {
      username,
      password,
      
      ...(isLoginMode ? {} : { email })
    };

    fetch(`http://localhost:5182/api/Auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(async (res) => {
     
      if (!res.ok) {
        const errorText = await res.text(); 
        throw new Error(errorText || "Възникна грешка.");
      }
      return res.json();
    })
    .then((user) => {
      alert(isLoginMode ? "Успешен вход!" : "Успешна регистрация!");
      
      onLogin(user);
    })
    .catch((err) => {
   
      alert("Грешка: " + err.message);
    });
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "30px", border: "1px solid #ddd", borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", textAlign: "center" }}>
      <h2 style={{ color: "#333" }}>{isLoginMode ? "🔐 Вход" : "📝 Регистрация"}</h2>
      
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        
        <input 
          type="text" 
          placeholder="Потребителско име"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          style={{ padding: "10px", fontSize: "16px" }}
        />

       
        {!isLoginMode && (
          <input 
            type="email" 
            placeholder="Email (напр. user@mail.com)"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ padding: "10px", fontSize: "16px" }}
          />
        )}

        <input 
          type="password" 
          placeholder="Парола"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ padding: "10px", fontSize: "16px" }}
        />

        <button type="submit" style={{ padding: "12px", fontSize: "16px", background: "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
          {isLoginMode ? "Влез" : "Регистрирай се"}
        </button>
      </form>

      <hr style={{ margin: "20px 0" }} />

      <p style={{ color: "#666" }}>
        {isLoginMode ? "Нямаш акаунт?" : "Вече имаш акаунт?"}
        <button 
          onClick={() => setIsLoginMode(!isLoginMode)}
          style={{ background: "none", border: "none", color: "#007bff", textDecoration: "underline", cursor: "pointer", marginLeft: "5px", fontSize: "14px" }}
        >
          {isLoginMode ? "Регистрирай се тук" : "Влез тук"}
        </button>
      </p>
    </div>
  );
}