import React, { useState } from "react";
import "./SignIn.css";
import { useNavigate } from "react-router-dom";

const SignIn = () => {
  const navigate = useNavigate();

  const goToHomePage = () => {
    navigate("/");
  };
  const [Name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Sign in attempt with:", { Name, password, rememberMe });
    // Add authentication logic here
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
                <label htmlFor="email">Name</label>
                <input
                  type="text"
                  id="Name"
                  value={Name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your Name"
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
