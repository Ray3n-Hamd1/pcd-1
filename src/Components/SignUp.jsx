import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
const SignUp = () => {
  const navigate = useNavigate();

  const goToHomePage = () => {
    navigate("/");
  };
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    console.log("Sign up attempt with:", {
      fullName,
      email,
      password,
      agreeTerms,
    });
    // Add registration logic here
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
            <h2 className="auth-title">Create Account</h2>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
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
                  placeholder="Create a password"
                  required
                />
                <small className="password-hint">
                  Must be at least 8 characters with a number and special
                  character
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <div className="form-terms">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  required
                />
                <label htmlFor="terms">
                  I agree to the{" "}
                  <a href="#terms" className="auth-link">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#privacy" className="auth-link">
                    Privacy Policy
                  </a>
                </label>
              </div>

              <button type="submit" className="auth-button">
                Sign Up
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Already have an account?{" "}
                <a href="/signin" className="auth-link">
                  Sign In
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-logo">
          <svg
            className="footer-icon"
            width="40"
            height="40"
            viewBox="0 0 40 40"
          >
            <circle fill="#555" cx="20" cy="20" r="8" />
            <circle fill="#555" cx="10" cy="30" r="5" />
            <circle fill="#555" cx="30" cy="30" r="5" />
            <line
              stroke="#555"
              strokeWidth="2"
              x1="20"
              y1="20"
              x2="10"
              y2="30"
            />
            <line
              stroke="#555"
              strokeWidth="2"
              x1="20"
              y1="20"
              x2="30"
              y2="30"
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

export default SignUp;
