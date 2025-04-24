import React, { useState, useRef } from "react";
import "./Upload.css";
import { encryptFile } from '../utils/encryption';

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);
  const dragItem = useRef();
  const dragOverItem = useRef();
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  };
  const addFiles = (newFiles) => {
    // Filter out duplicates
    const filteredFiles = newFiles.filter(
      newFile => !files.some(existingFile => existingFile.name === newFile.name)
    );
  
    // Add new files to existing files
    setFiles(prevFiles => [...prevFiles, ...filteredFiles]);
  };
  const removeFile = (indexToRemove) => {
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    
    // Also remove the file's progress
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[files[indexToRemove].name];
      return newProgress;
    });
  };

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

  const handleUploadClick = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      // Step 1: Encrypt each file
      const encryptedFiles = [];
      const formData = new FormData();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Update progress to show encryption is happening
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 10 // Show 10% progress for encryption start
        }));
        
        // Encrypt the file
        const { encryptedBlob, key, iv } = await encryptFile(file);
        
        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 30 // Encryption complete - 30%
        }));
        
        // Add to our tracking array
        encryptedFiles.push({
          originalName: file.name,
          encryptedBlob,
          key,
          iv
        });
        
        // Add to form data for upload
        formData.append('files', encryptedBlob, `${file.name}.encrypted`);
      }
      
      // Step 2: Upload encrypted files to Azure Blob Storage
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        files.forEach(file => {
          newProgress[file.name] = 50; // Upload started - 50%
        });
        return newProgress;
      });
      
      const uploadResponse = await fetch("http://localhost:5000/uploadFile", {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload files to Azure');
      }
      
      const uploadResult = await uploadResponse.json();
      
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        files.forEach(file => {
          newProgress[file.name] = 75; // Upload complete - 75%
        });
        return newProgress;
      });
      
      // Step 3: Save encryption data in the database
      for (let i = 0; i < uploadResult.files.length; i++) {
        const fileUploadInfo = uploadResult.files[i];
        
        // Find matching encrypted file info
        const originalFileName = fileUploadInfo.originalName.replace('.encrypted', '');
        const encryptedFileInfo = encryptedFiles.find(ef => ef.originalName === originalFileName);
        const arrayBufferToBase64 = (buffer) => {
          if (!buffer) return '';
          
          let binary = '';
          const bytes = new Uint8Array(buffer);
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          return window.btoa(binary);
        };
        if (encryptedFileInfo) {
          // Save encryption data in database
          const saveDataResponse = await fetch("http://localhost:5000/saveEncryptionData", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fileName: fileUploadInfo.encryptedName,
              originalName: originalFileName,
              blobUrl: fileUploadInfo.blobUrl,
              // Convert encryption key and IV to base64 strings if they're not already
              encryptionKey: typeof encryptedFileInfo.key === 'string' 
                ? encryptedFileInfo.key 
                : arrayBufferToBase64(encryptedFileInfo.key),
              iv: typeof encryptedFileInfo.iv === 'string'
                ? encryptedFileInfo.iv
                : arrayBufferToBase64(encryptedFileInfo.iv),
              userId: 1, // Replace with actual user ID from your authentication system
              
            })
          });
          if (!saveDataResponse.ok) {
            const errorData = await saveDataResponse.json();
            console.error('Error response from server:', errorData);
            throw new Error(`Failed to save encryption data: ${errorData.error || 'Unknown error'}`);
          }
          const saveResult = await saveDataResponse.json();
          console.log('Encryption data saved:', saveResult);
          
          // Update progress to 100% for this file
          setUploadProgress(prev => ({
            ...prev,
            [originalFileName]: 100
          }));
        }
      }
      
      // Success!
      setIsUploaded(true);
      setIsUploading(false);
      
      // Clear form after short delay
      setTimeout(() => {
        if (uploadResult.files.length === files.length) {
          setFiles([]);
          setUploadProgress({});
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error in upload process:', error);
      setIsUploading(false);
      alert(`Error: ${error.message}`);
    }
  };
  // Function to save encryption keys (you need to implement this)
  const saveEncryptionKeys = async (encryptionData) => {
    // IMPORTANT: You need to securely store these keys
    // Options include:
    // 1. Save to a secure database (separate from the files)
    // 2. Use a key management service
    // 3. Encrypt the keys themselves with a master key
    
    try {
      const response = await fetch("http://localhost:5000/saveKeys", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ encryptionData })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save encryption keys');
      }
      
      console.log('Encryption keys saved successfully');
    } catch (error) {
      console.error('Error saving encryption keys:', error);
      alert('Warning: Encryption keys could not be saved. You may not be able to decrypt your files.');
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
          {isUploading ? 'Uploading...' : 'Upload '}
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
            Your documents have been securely encrypted and uploaded <span className="highlight">to Azure storage</span>.
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