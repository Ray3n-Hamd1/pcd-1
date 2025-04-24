import { useState } from "react";
import "./HomePage.css";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  const goToSignIn = () => {
    navigate("/SignIn");
  };
  const goToSignUp = () => {
    navigate("/SignUP");
  };
  return (
    <div className="container">
      {/* Header Bar */}
      <header className="header">
        {/* Logo */}
        <div className="logo-container">
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

        {/* Search Bar */}
        <div className="search-container">
          <input type="text" placeholder="Search..." className="search-input" />
          <button className="search-button">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>

        {/* Sign In/Up Buttons */}
        <div className="auth-buttons">
          <button className="sign-in-button" onClick={goToSignIn}>
            sign in
          </button>
          <button className="sign-up-button" onClick={goToSignUp}>
            sign up
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Background Triangle */}
        <div className="background-triangle"></div>

        {/* Content */}
        <div className="content">
          {/* Main Heading */}
          <h1 className="main-heading">Welcome to SECURESAFE</h1>

          {/* Description */}
          <p className="description">
            Welcome to Securesafe - a decentralized application (dApp) designed
            to securely store and manage your encrypted documents.
          </p>
          <p className="description">Our platform ensures:</p>

          {/* Feature Cards */}
          <div className="feature-cards">
            {/* Card 1 */}
            <div className="feature-card">
              <h3 className="feature-text">
                Confidentiality through encryption of your files before upload.
              </h3>
            </div>

            {/* Card 2 */}
            <div className="feature-card">
              <h3 className="feature-text">
                Integrity by storing encryption keys on a secure blockchain
                network.
              </h3>
            </div>

            {/* Card 3 */}
            <div className="feature-card">
              <h3 className="feature-text">
                Accessibility with seamless cloud storage integration.
              </h3>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>©2025 secure document vault.contact email ahdfk@gmail.com</p>
      </footer>
    </div>
  );
};
export default HomePage;
