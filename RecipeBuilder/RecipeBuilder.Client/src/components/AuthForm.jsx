import { useState } from "react";
import { GoogleLogin } from '@react-oauth/google';
import "./AuthForm.css"; 
export default function AuthForm({ onLogin }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const endpoint = isLoginMode ? "login" : "register";
    
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

// --- ЛОГИКА ЗА GOOGLE ---
  const handleGoogleSuccess = (credentialResponse) => {
    // Взимаме токена от Google
    const token = credentialResponse.credential;

    // Пращаме го на нашия Backend за проверка
    fetch("http://localhost:5182/api/Auth/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token })
    })
    .then(async res => {
        if (!res.ok) throw new Error("Грешка при Google вход");
        return res.json();
    })
    .then(user => {
        // Успешен вход!
        alert(`Добре дошъл, ${user.username}!`);
        onLogin(user);
    })
    .catch(err => alert(err.message));
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">{isLoginMode ? "🔐 Вход" : "📝 Регистрация"}</h2>
      
      <form onSubmit={handleSubmit} className="auth-form">
        <input 
          className="auth-input"
          type="text" 
          placeholder="Потребителско име"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />

        {!isLoginMode && (
          <input 
            className="auth-input"
            type="email" 
            placeholder="Email (напр. user@mail.com)"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        )}

        <input 
          className="auth-input"
          type="password" 
          placeholder="Парола"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="auth-button">
          {isLoginMode ? "Влез" : "Регистрирай се"}
        </button>
      </form>

      <div className="google-login-container">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => {
            alert('Грешка при Google вход');
          }}
        />
      </div>

      <hr className="auth-divider" />

      <p className="auth-switch-text">
        {isLoginMode ? "Нямаш акаунт?" : "Вече имаш акаунт?"}
        <button 
          className="auth-switch-btn"
          onClick={() => setIsLoginMode(!isLoginMode)}
        >
          {isLoginMode ? "Регистрирай се тук" : "Влез тук"}
        </button>
      </p>
    </div>
  );
}