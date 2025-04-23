import React, { useState, useRef } from "react";
import "./Upload.css";
import { encryptFile } from '../utils/encryption';
// Import Azure Storage SDK
import { BlobServiceClient } from '@azure/storage-blob';

const UserProfile = () => {
  return (
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
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="black"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </div>
  );
};

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

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);
  const dragItem = useRef();
  const dragOverItem = useRef();

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
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles) => {
    const updatedFiles = [...files];
    newFiles.forEach((file) => {
      if (!updatedFiles.find((f) => f.name === file.name && f.size === file.size)) {
        updatedFiles.push(file);
      }
    });
    setFiles(updatedFiles);
    setIsUploaded(false);
  };

  const removeFile = (index) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
  };

  // Function to upload files to Azure Blob Storage
  const handleUploadClick = async () => {
    const formData = new FormData();
    
    // Append file(s) to form data
    for (const file of files) {
      formData.append('file', file);
    }
  
    try {
      const response = await fetch("http://localhost:5000/uploadFile", {
        method: 'POST',
        body: formData
      });
  
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
  
      const result = await response.json();
      alert(result.message);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files: ' + error.message);
    }
  };
  

  const formatFileSize = (bytes) => {
    const kb = bytes / 1024;
    return kb < 1024 ? `${kb.toFixed(2)} KB` : `${(kb / 1024).toFixed(2)} MB`;
  };

  const handleDragStart = (index) => {
    dragItem.current = index;
  };

  const handleDragEnterItem = (index) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    const updatedFiles = [...files];
    const draggedItem = updatedFiles[dragItem.current];
    updatedFiles.splice(dragItem.current, 1);
    updatedFiles.splice(dragOverItem.current, 0, draggedItem);
    dragItem.current = null;
    dragOverItem.current = null;
    setFiles(updatedFiles);
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
              <line x1="50" y1="30" x2="30" y2="70" stroke="#1a1a5f" strokeWidth="5" />
              <line x1="50" y1="30" x2="70" y2="70" stroke="#1a1a5f" strokeWidth="5" />
              <line x1="30" y1="70" x2="70" y2="70" stroke="#1a1a5f" strokeWidth="5" />
            </svg>
          </div>
          <span className="logo-text">SECURESAFE</span>
        </div>
        <SearchBar />
        <UserProfile />
      </header>

      {/* Main content */}
      <div className="upload-content">
        
        {files.length === 0 ? (
          <div
            className={`dropzone ${isDragging ? "dropzone-active" : ""}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="file-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#172B4D"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                <polyline points="13 2 13 9 20 9"></polyline>
              </svg>
            </div>
            <button className="browse-button" onClick={handleBrowseClick}>
              Browse
            </button>
            <p className="dropzone-text">Drag and drop files here, or click browse</p>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
              multiple
            />
          </div>
        ) : (
          <div className="preview-section">
            <h3>Selected Files:</h3>
            <ul className="file-list">
              {files.map((file, index) => (
                <li
                  key={index}
                  className="file-item"
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnterItem(index)}
                  onDragEnd={handleDragEnd}
                >
                  <span>{file.name}</span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                  {uploadProgress[file.name] > 0 && uploadProgress[file.name] < 100 && (
                    <div className="progress-bar">
                      <div 
                        className="progress" 
                        style={{ width: `${uploadProgress[file.name]}%` }}
                      ></div>
                    </div>
                  )}
                  <button className="remove-btn" onClick={() => removeFile(index)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button className="add-more-button" onClick={handleBrowseClick}>
              Add More Files
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
              multiple
            />
          </div>
        )}

        <button
          className="upload-button"
          onClick={handleUploadClick}
          disabled={files.length === 0 || isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload to Azure'}
        </button>

        {isUploading && (
          <div className="upload-spinner">
            <svg 
              className="spinner" 
              width="40" 
              height="40" 
              viewBox="0 0 50 50"
            >
              <circle 
                className="path" 
                cx="25" 
                cy="25" 
                r="20" 
                fill="none" 
                strokeWidth="5"
              ></circle>
            </svg>
          </div>
        )}

        {isUploaded && (
          <p className="upload-message">
            Your documents have been securely uploaded <span className="highlight">to Azure storage</span>.
          </p>
        )}
      </div>
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
        ©2025 secure document vault. Contact email ahdfk@gmail.com
      </footer>
    </div>
  );
};

export default Upload;