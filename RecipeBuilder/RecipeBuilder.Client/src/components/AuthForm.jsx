import { useState } from "react";
import { GoogleLogin } from '@react-oauth/google';
import "./AuthForm.css"; 

export default function AuthForm({ onLogin }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isVerificationMode, setIsVerificationMode] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. АКО СМЕ В РЕЖИМ ВЕРИФИКАЦИЯ
    if (isVerificationMode) {
        fetch("http://localhost:5182/api/Auth/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code: verificationCode })
        })
        .then(async res => {
            // Тук четем отговора като JSON, за да изчистим грешката
            const data = await res.json();
            
            if (!res.ok) {
                let errorMessage = "Възникна грешка.";
                
                // Проверяваме различните формати на грешки от .NET
                if (data.errors) {
                    errorMessage = Object.values(data.errors).flat().join("\n");
                } else if (data.message) {
                    errorMessage = data.message;
                } else if (typeof data === 'string') {
                    errorMessage = data;
                }
                
                throw new Error(errorMessage);
            }
            return data;
        })
        .then(user => {
            alert("Успешно потвърждение!");
            onLogin(user);
        })
        .catch(err => alert(err.message));
        return;
    }

    // 2. СТАНДАРТЕН ВХОД / РЕГИСТРАЦИЯ
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
      // Тук също четем като JSON
      const data = await res.json();

      if (!res.ok) {
        let errorMessage = "Възникна грешка.";
        
        // Логика за изчистване на символите от грешката
        if (data.errors) {
            errorMessage = Object.values(data.errors).flat().join("\n");
        } else if (data.message) {
            errorMessage = data.message;
        } else if (typeof data === 'string') {
            errorMessage = data;
        }
        
        throw new Error(errorMessage);
      }
      return data;
    })
    .then((data) => {
      if (isLoginMode) {
          alert("Успешен вход!");
          onLogin(data);
      } else {
          // При успешна регистрация минаваме към верификация
          alert("Успешна регистрация! Провери имейла си за код.");
          setIsVerificationMode(true);
      }
    })
    .catch((err) => {
      alert(err.message);
    });
  };

  // --- ЛОГИКА ЗА GOOGLE ---
  const handleGoogleSuccess = (credentialResponse) => {
    const token = credentialResponse.credential;

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
        alert(`Добре дошъл, ${user.username}!`);
        onLogin(user);
    })
    .catch(err => alert(err.message));
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">
        {isVerificationMode ? "📩 Потвърди Email" : (isLoginMode ? "🔐 Вход" : "📝 Регистрация")}
      </h2>
      
      <form onSubmit={handleSubmit} className="auth-form">
        {isVerificationMode ? (
            <>
                <p style={{fontSize: "14px", color: "#555", marginBottom: "10px"}}>
                   Въведи кода изпратен на: <b>{email}</b>
                </p>
                <input 
                  className="auth-input"
                  type="text" 
                  placeholder="Код за потвърждение"
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value)}
                  required
                  style={{textAlign: "center", letterSpacing: "5px", fontSize: "20px"}}
                />
                <button type="submit" className="auth-button" style={{background: "#28a745"}}>
                  Потвърди
                </button>
                <button 
                    type="button" 
                    onClick={() => setIsVerificationMode(false)}
                    style={{background: "none", border: "none", color: "#666", marginTop: "10px", cursor: "pointer"}}
                >
                    Отказ
                </button>
            </>
        ) : (
            <>
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
            </>
        )}
      </form>

      {!isVerificationMode && (
          <>
              <div className="google-login-container" style={{display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', marginTop: '15px'}}>
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
          </>
      )}
    </div>
  );
}