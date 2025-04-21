import React, { useState, useRef } from "react";
import "./Upload.css";

const Upload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file) => {
    setIsUploading(true);

    // Simulate file upload with a timeout
    setTimeout(() => {
      setIsUploading(false);
      setIsUploaded(true);
    }, 2000);
  };

  const handleUploadButtonClick = () => {
    if (!isUploaded && !isUploading) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
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

        <div className="search-container">
          <input type="text" placeholder="search..." className="search-input" />
          <button className="search-button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#888"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>

        <div className="user-profile">
          <div className="user-avatar">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <span className="user-name">name</span>
          <span className="dropdown-arrow">▼</span>
        </div>
      </header>

      {/* Main content */}
      <div className="upload-content">
        <div
          className={`dropzone ${isDragging ? "dropzone-active" : ""}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="file-icon">
            <svg
              width="60"
              height="60"
              viewBox="0 0 60 60"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M35 10H15C13.3431 10 12 11.3431 12 13V47C12 48.6569 13.3431 50 15 50H45C46.6569 50 48 48.6569 48 47V23L35 10Z"
                stroke="#172B4D"
                strokeWidth="2"
              />
              <path d="M35 10V23H48" stroke="#172B4D" strokeWidth="2" />
              <path
                d="M30 30C30 33.866 26.866 37 23 37C19.134 37 16 33.866 16 30C16 26.134 19.134 23 23 23C26.866 23 30 26.134 30 30Z"
                stroke="#172B4D"
                strokeWidth="2"
              />
              <path
                d="M25 29L22 32L21 31"
                stroke="#172B4D"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <button className="browse-button" onClick={handleBrowseClick}>
            browse
          </button>

          <p className="dropzone-text">
            drag and drop a file here, or click to browse
          </p>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>

        <button
          className="upload-button"
          onClick={handleUploadButtonClick}
          disabled={isUploading || isUploaded}
        >
          upload
        </button>

        {isUploading && (
          <div className="upload-spinner">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="#172B4D"
                strokeWidth="2"
                strokeOpacity="0.2"
              />
              <path
                d="M12 2C6.5 2 2 6.5 2 12"
                stroke="#172B4D"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 12 12"
                  to="360 12 12"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </path>
            </svg>
          </div>
        )}

        {isUploaded && (
          <p className="upload-message">
            your document has been securely uploaded{" "}
            <span className="highlight">and encrypted!</span>
          </p>
        )}
      </div>

      {/* Orange triangle decoration */}
      <div className="triangle-decoration">
        <div className="triangle-logo">
          <svg
            width="60"
            height="60"
            viewBox="0 0 60 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="30" cy="15" r="9" fill="#172B4D" />
            <circle cx="15" cy="42" r="9" fill="#172B4D" />
            <circle cx="45" cy="42" r="9" fill="#172B4D" />
            <line
              x1="30"
              y1="15"
              x2="15"
              y2="42"
              stroke="#172B4D"
              strokeWidth="3"
            />
            <line
              x1="30"
              y1="15"
              x2="45"
              y2="42"
              stroke="#172B4D"
              strokeWidth="3"
            />
            <line
              x1="15"
              y1="42"
              x2="45"
              y2="42"
              stroke="#172B4D"
              strokeWidth="3"
            />
          </svg>
        </div>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        ©2025 secure document vault.contact email ahdfk@gmail.com
      </footer>
    </div>
  );
};

export default Upload;
