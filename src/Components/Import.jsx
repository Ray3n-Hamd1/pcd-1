import React, { useState } from "react";
import "./Import.css";
import DropDownMenu from "./DropDownMenu";

// Logo component
const Logo = () => {
  return (
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
  );
};

// Component for the search bar in the header
const SearchBar = () => {
  return (
    <div className="search-container">
      <input type="text" placeholder="Search..." className="search-input" />
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
  );
};

// Component for the document item in the list
const DocumentItem = ({ fileName, fileSize, date, onSelect }) => {
  const isRedFilename = fileName === "presentati.pdf";

  return (
    <div className="document-item">
      <div className="document-info">
        <div className="document-icon">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="40" height="40" rx="5" fill="white" />
            <rect
              x="8"
              y="8"
              width="24"
              height="30"
              rx="2"
              stroke="black"
              strokeWidth="2"
            />
            <line
              x1="12"
              y1="14"
              x2="28"
              y2="14"
              stroke="black"
              strokeWidth="2"
            />
            <line
              x1="12"
              y1="18"
              x2="28"
              y2="18"
              stroke="black"
              strokeWidth="2"
            />
            <line
              x1="12"
              y1="22"
              x2="28"
              y2="22"
              stroke="black"
              strokeWidth="2"
            />
            <line
              x1="12"
              y1="26"
              x2="20"
              y2="26"
              stroke="black"
              strokeWidth="2"
            />
          </svg>
        </div>
        <div className="document-details">
          <div
            className={`document-name ${
              isRedFilename ? "document-name-red" : ""
            }`}
          >
            {fileName}
          </div>
          <div className="document-size">{fileSize}</div>
        </div>
      </div>

      <div className="document-meta">
        <div className="document-date">{date}</div>
        <div className="document-status">Encrypted</div>
        <button className="document-select-btn" onClick={onSelect}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>
    </div>
  );
};

// Component for the file preview on the right side
const FilePreview = ({ selectedFile }) => {
  return (
    <div className="file-preview">
      <div className="preview-icon">
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="80" height="80" rx="5" fill="white" />
          <rect
            x="14"
            y="10"
            width="52"
            height="70"
            rx="2"
            stroke="black"
            strokeWidth="3"
          />
          <line
            x1="22"
            y1="25"
            x2="58"
            y2="25"
            stroke="black"
            strokeWidth="3"
          />
          <line
            x1="22"
            y1="35"
            x2="58"
            y2="35"
            stroke="black"
            strokeWidth="3"
          />
          <line
            x1="22"
            y1="45"
            x2="58"
            y2="45"
            stroke="black"
            strokeWidth="3"
          />
          <line
            x1="22"
            y1="55"
            x2="40"
            y2="55"
            stroke="black"
            strokeWidth="3"
          />
        </svg>
      </div>

      <div className="preview-filename">
        {selectedFile ? selectedFile.name : "report.pdf"}
      </div>

      <div className="preview-filesize">
        {selectedFile ? selectedFile.size : "35.5ko"}
      </div>

      <button className="btn-retrieve">Retrieve key from blockchain</button>

      <button className="btn-decrypt">decrypt and download</button>
    </div>
  );
};

// Main app component
const Import = () => {
  const [selectedFile, setSelectedFile] = useState(null);

  const documentFiles = [
    { name: "report.pdf", size: "35.5 ko", date: "29 fev,2025" },
    { name: "presentati.pdf", size: "35.5 ko", date: "29 fev,2025" },
    { name: "cv.txt", size: "35.5 ko", date: "29 fev,2025" },
    { name: "contrat.word", size: "35.5 ko", date: "29 fev,2025" },
    { name: "rapport.pdf", size: "35.5 ko", date: "29 fev,2025" },
  ];

  const handleSelectFile = (file) => {
    setSelectedFile(file);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <Logo />
        <DropDownMenu />
      </header>

      {/* Main content */}
      <div className="app-content">
        {/* Left side - File list */}
        <div className="file-list-container">
          <h2 className="section-title">IMPORT</h2>
          <p className="section-description">
            select a file to securely import and decrypt form the cloud
          </p>

          <div className="document-list">
            {documentFiles.map((file, index) => (
              <DocumentItem
                key={index}
                fileName={file.name}
                fileSize={file.size}
                date={file.date}
                onSelect={() => handleSelectFile(file)}
              />
            ))}
          </div>
        </div>

        {/* Right side - File preview */}
        <div className="preview-container">
          <FilePreview selectedFile={selectedFile} />
        </div>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        ©2025 secure document vault.contact email ahdfk@gmail.com
      </footer>
    </div>
  );
};

export default Import;
