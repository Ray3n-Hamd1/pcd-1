import React from "react";
import "./UploadImport.css";

function UploadImport() {
  return (
    <div className="secure-safe-container">
      <header className="header">
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

        <div className="search-bar">
          <input type="text" placeholder="Search..." />
          <button className="search-button">
            <i className="search-icon">🔍</i>
          </button>
        </div>
        <div className="user-profile">
          <img src="/user-icon.svg" alt="User Profile" className="user-icon" />
          <span className="username">name</span>
          <span className="dropdown-arrow">▼</span>
        </div>
      </header>

      <main className="main-content">
        <div className="upload-section">
          <h2 className="upload-heading">
            Click to upload, tap to import – it's that easy.
          </h2>
          <div className="divider"></div>

          <div className="document-icon-container">
            <div className="document-icon">
              <div className="document-lines"></div>
            </div>
          </div>

          <div className="action-buttons">
            <button className="upload-button">
              <div className="icon-container">
                <i className="upload-icon">↑</i>
              </div>
              <span className="button-text">upload</span>
            </button>

            <button className="import-button">
              <div className="icon-container">
                <i className="import-icon">↓</i>
              </div>
              <span className="button-text">import</span>
            </button>
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
}

export default UploadImport;
