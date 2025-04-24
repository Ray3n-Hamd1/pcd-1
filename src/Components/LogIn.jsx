import React, { useState } from "react";
import "./LogIn.css";
import { useNavigate } from "react-router-dom";

const SignIn = () => {
  const navigate = useNavigate();

  const goToHomePage = () => {
    navigate("/");
  };
  const [Email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: Email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Login failed");
        return;
      }

      // ✅ Store token + user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // 👇 Optional: confirm what role they are
      console.log("User role:", data.user.role);

      navigate("/uploadimport");
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed. Try again.");
    }
  };

  return (
    <div className="secure-safe-container">
      <header className="header">
        <div className="logo-container" onClick={goToHomePage}>
          <div className="logo">
            <svg viewBox="0 0 100 100" className="logo-svg">
              <circle cx="50" cy="30" r="15" fill="#1a1a5f" />
              <circle cx="30" cy="70" r="15" fill="#1a1a5f" />
              <circle cx="70" cy="70" r="15" fill="#1a1a5f" />
              <line
                x1="50"
                y1="30"
                x2="30"
                y2="70"
                stroke="#1a1a5f"
                strokeWidth="5"
              />
              <line
                x1="50"
                y1="30"
                x2="70"
                y2="70"
                stroke="#1a1a5f"
                strokeWidth="5"
              />
              <line
                x1="30"
                y1="70"
                x2="70"
                y2="70"
                stroke="#1a1a5f"
                strokeWidth="5"
              />
            </svg>
          </div>
          <span className="logo-text">SECURESAFE</span>
        </div>
      </header>

      <main className="main-content">
        <div className="auth-container">
          <div className="auth-card">
            <h2 className="auth-title">Sign In</h2>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="Email"
                  value={Email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your Email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div className="form-options">
                <div className="remember-me">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label htmlFor="remember">Remember me</label>
                </div>
                <a href="#forgot-password" className="forgot-password">
                  Forgot password?
                </a>
              </div>

              <button type="submit" className="auth-button">
                Sign In
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Don't have an account?{" "}
                <a href="/signup" className="auth-link">
                  Sign Up
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-logo">
          <svg viewBox="0 0 100 100" className="logo-svg">
            <circle cx="50" cy="30" r="15" fill="#1a1a5f" />
            <circle cx="30" cy="70" r="15" fill="#1a1a5f" />
            <circle cx="70" cy="70" r="15" fill="#1a1a5f" />
            <line
              x1="50"
              y1="30"
              x2="30"
              y2="70"
              stroke="#1a1a5f"
              strokeWidth="5"
            />
            <line
              x1="50"
              y1="30"
              x2="70"
              y2="70"
              stroke="#1a1a5f"
              strokeWidth="5"
            />
            <line
              x1="30"
              y1="70"
              x2="70"
              y2="70"
              stroke="#1a1a5f"
              strokeWidth="5"
            />
          </svg>
        </div>
        <div className="copyright">
          ©2023 Secure document vault contact email: John.s.gmail.com
        </div>
      </footer>
    </div>
  );
};
export default SignIn;
