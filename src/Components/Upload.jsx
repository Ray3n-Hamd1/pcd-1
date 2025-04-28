import React, { useState, useRef, useEffect } from "react";
import "./Upload.css";
import { encryptFile } from "../utils/encryption";
import BlockchainService from '../services/blockchainService';
import Web3 from 'web3';

import DropDownMenu from "./DropDownMenu";

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);
  const dragItem = useRef();
  const dragOverItem = useRef();

  // User and department state
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [subDepartments, setSubDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedSubDepartment, setSelectedSubDepartment] = useState("");
  //blockchain
  const [blockchainService, setBlockchainService] = useState(null);
const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false);
const [blockchainStatus, setBlockchainStatus] = useState({});
const [retrievalError, setRetrievalError] = useState(null);

// Add this to your existing useEffect section
useEffect(() => {
  const initBlockchain = async () => {
    const service = new BlockchainService();
    const connected = await service.initMetaMask();
    
    if (connected) {
      setBlockchainService(service);
      setIsMetaMaskConnected(true);
    }
  };

  initBlockchain();
}, []);

  // Get user data from localStorage when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userString = localStorage.getItem("user");
        if (!userString) {
          console.error("User not found in localStorage");
          alert("Please log in to access this page");
          setLoading(false);
          return;
        }

        const user = JSON.parse(userString);
        setUserId(user.id);
        setUserRole(user.role);

        // Fetch departments based on user role
        if (user.role === "superadmin") {
          fetchSuperAdminDepartments(user.id);
        } else if (user.role === "admin") {
          fetchAdminDepartments(user.id);
        } else {
          fetchUserDepartments(user.id);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Fetch sub-departments when a department is selected
  useEffect(() => {
    if (selectedDepartment) {
      fetchSubDepartments(selectedDepartment);
    } else {
      setSubDepartments([]);
      setSelectedSubDepartment("");
    }
  }, [selectedDepartment]);

  // Functions to fetch departments based on user role
  const fetchSuperAdminDepartments = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/superadmin/${id}/departments`
      );
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      } else {
        console.error("Failed to fetch superadmin departments");
      }
    } catch (error) {
      console.error("Error fetching superadmin departments:", error);
    }
  };

  const fetchAdminDepartments = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/admin/${id}/departments`
      );
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      } else {
        console.error("Failed to fetch admin departments");
      }
    } catch (error) {
      console.error("Error fetching admin departments:", error);
    }
  };

  const fetchUserDepartments = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/user/${id}/departments`
      );
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      } else {
        console.error("Failed to fetch user departments");
      }
    } catch (error) {
      console.error("Error fetching user departments:", error);
    }
  };

  // Function to fetch sub-departments for a department
  const fetchSubDepartments = async (departmentId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/departments/${departmentId}/sousdepartments`
      );
      if (response.ok) {
        const data = await response.json();
        setSubDepartments(data);
        if (data.length === 1) {
          setSelectedSubDepartment(data[0].id_sous_departement);
        }
      } else {
        console.error("Failed to fetch sub-departments");
      }
    } catch (error) {
      console.error("Error fetching sub-departments:", error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles) => {
    // Filter out duplicates
    const filteredFiles = newFiles.filter(
      (newFile) =>
        !files.some((existingFile) => existingFile.name === newFile.name)
    );

    // Add new files to existing files
    setFiles((prevFiles) => [...prevFiles, ...filteredFiles]);
  };

  const removeFile = (indexToRemove) => {
    setFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );

    // Also remove the file's progress
    setUploadProgress((prev) => {
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

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
  };

  const handleSubDepartmentChange = (e) => {
    setSelectedSubDepartment(e.target.value);
  };

  const handleUploadClick = async () => {
    if (files.length === 0) return;
  
    // Check if a sub-department is selected
    if (!selectedSubDepartment) {
      alert("Please select a department and sub-department before uploading.");
      return;
    }
  
    // Check if MetaMask is connected
    if (!blockchainService) {
      alert("Please connect to MetaMask to upload files.");
      return;
    }
  
    setIsUploading(true);
  
    try {
      // Step 1: Encrypt each file
      const encryptedFiles = [];
      const formData = new FormData();
  
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
  
        // Update progress to show encryption is happening
        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: 10, // Show 10% progress for encryption start
        }));
  
        // Encrypt the file
        const { encryptedBlob, key, iv } = await encryptFile(file);
  
        // Update progress
        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: 30, // Encryption complete - 30%
        }));
  
        // Add to our tracking array
        encryptedFiles.push({
          originalName: file.name,
          encryptedBlob,
          key,
          iv,
        });
  
        // Add to form data for upload
        formData.append("files", encryptedBlob, `${file.name}.encrypted`);
      }
  
      // Step 2: Upload encrypted files to Azure Blob Storage
      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        files.forEach((file) => {
          newProgress[file.name] = 50; // Upload started - 50%
        });
        return newProgress;
      });
  
      const uploadResponse = await fetch("http://localhost:5000/uploadFile", {
        method: "POST",
        body: formData,
      });
  
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload files to Azure");
      }
  
      const uploadResult = await uploadResponse.json();
  
      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        files.forEach((file) => {
          newProgress[file.name] = 75; // Upload complete - 75%
        });
        return newProgress;
      });
  
      // Step 3: Save encryption data in the database and blockchain
      for (let i = 0; i < uploadResult.files.length; i++) {
        const fileUploadInfo = uploadResult.files[i];
  
        // Find matching encrypted file info
        const originalFileName = fileUploadInfo.originalName.replace(
          ".encrypted",
          ""
        );
        const encryptedFileInfo = encryptedFiles.find(
          (ef) => ef.originalName === originalFileName
        );
        const arrayBufferToBase64 = (buffer) => {
          if (!buffer) return "";
  
          let binary = "";
          const bytes = new Uint8Array(buffer);
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          return window.btoa(binary);
        };
  
        if (encryptedFileInfo) {
          // Prepare encryption key for blockchain
          const encryptionKey = 
            typeof encryptedFileInfo.key === "string"
              ? encryptedFileInfo.key
              : arrayBufferToBase64(encryptedFileInfo.key);
          
          console.log(`Encryption key for ${originalFileName}:`, encryptionKey);

          // Generate blockchain hash for encryption key
          const encryptionKeyHash = Web3.utils.sha3(encryptionKey);
  
          try {
            // Register file on blockchain
            const blockchainResult = await blockchainService.registerFileOnBlockchain(
              originalFileName,
              encryptionKey
            );
  
            // Update blockchain status
            setBlockchainStatus((prev) => ({
              ...prev,
              [originalFileName]: {
                status: 'Blockchain Registered',
                fileId: blockchainResult.fileId,
                transactionHash: blockchainResult.transactionHash  
              }
            }));
  
            // Save encryption data in database
            const saveDataResponse = await fetch(
              "http://localhost:5000/saveEncryptionData",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  fileName: fileUploadInfo.encryptedName,
                  originalName: originalFileName,
                  blobUrl: fileUploadInfo.blobUrl,
                  encryptionKey: encryptionKey,
                  iv:
                    typeof encryptedFileInfo.iv === "string"
                      ? encryptedFileInfo.iv
                      : arrayBufferToBase64(encryptedFileInfo.iv),
                  userId: userId,
                  sousDepId: selectedSubDepartment,
                  transactionHash: blockchainResult.transactionHash // Save full blockchain file ID
                }),
              }
            );
            
  
            if (!saveDataResponse.ok) {
              const errorData = await saveDataResponse.json();
              console.error("Error response from server:", errorData);
              throw new Error(
                `Failed to save encryption data: ${
                  errorData.error || "Unknown error"
                }`
              );
            }
  
            const saveResult = await saveDataResponse.json();
            console.log("Encryption data saved:", saveResult);
  
            // Update progress to 100% for this file
            setUploadProgress((prev) => ({
              ...prev,
              [originalFileName]: 100,
            }));
          } catch (blockchainError) {
            console.error('Blockchain registration failed:', blockchainError);
            
            // Update blockchain status for failed registration
            setBlockchainStatus((prev) => ({
              ...prev,
              [originalFileName]: {
                status: 'Blockchain Registration Failed',
                error: blockchainError.message
              }
            }));
  
            // Optionally, you might want to throw or handle this error differently
            throw blockchainError;
          }
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
          setBlockchainStatus({});
        }
      }, 2000);
    } catch (error) {
      console.error("Error in upload process:", error);
      setIsUploading(false);
      alert(`Error: ${error.message}`);
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

  // If still loading user data, show a loading indicator
  if (loading) {
    return (
      <div className="app-container upload-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container upload-page">
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

        <DropDownMenu/>
      </header>

      {/* Main content */}
      <div className="upload-content">
        {/* Department selection section */}
        <div className="department-selection">
          <h3>Select Department</h3>
          <div className="select-container">
            <select
              value={selectedDepartment}
              onChange={handleDepartmentChange}
              className="department-select"
            >
              <option value="">Select a department</option>
              {departments.map((dept) => (
                <option key={dept.id_departement} value={dept.id_departement}>
                  {dept.nom}
                </option>
              ))}
            </select>
          </div>

          {selectedDepartment && (
            <div className="select-container">
              <h3>Select Sub-Department</h3>
              <select
                value={selectedSubDepartment}
                onChange={handleSubDepartmentChange}
                className="subdepartment-select"
              >
                <option value="">Select a sub-department</option>
                {subDepartments.map((subDept) => (
                  <option
                    key={subDept.id_sous_departement}
                    value={subDept.id_sous_departement}
                  >
                    {subDept.nom}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

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
            <button
              className="browse-button"
              onClick={handleBrowseClick}
              disabled={!selectedSubDepartment}
            >
              Browse
            </button>
            <p className="dropzone-text">
              {selectedSubDepartment
                ? "Drag and drop files here, or click browse"
                : "Please select a department and sub-department first"}
            </p>
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
                  {uploadProgress[file.name] > 0 &&
                    uploadProgress[file.name] < 100 && (
                      <div className="progress-bar">
                        <div
                          className="progress"
                          style={{ width: `${uploadProgress[file.name]}%` }}
                        ></div>
                      </div>
                    )}
                  <button
                    className="remove-btn"
                    onClick={() => removeFile(index)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button
              className="add-more-button"
              onClick={handleBrowseClick}
              disabled={!selectedSubDepartment}
            >
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
          disabled={files.length === 0 || isUploading || !selectedSubDepartment}
        >
          {isUploading ? "Uploading..." : "Upload "}
        </button>

        {isUploading && (
          <div className="upload-spinner">
            <svg className="spinner" width="40" height="40" viewBox="0 0 50 50">
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
            Your documents have been securely encrypted and uploaded{" "}
            <span className="highlight">to Azure storage</span>.
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
