import React, { useState, useEffect } from "react";
import "./Import.css";
import DropDownMenu from "./DropDownMenu";
import BlockchainService from "../services/blockchainService";
import { decryptFile } from "../utils/encryption";
// Import Web3 at the top of the file
import Web3 from "web3";

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

// Department selector component
const DepartmentSelector = ({ departments, selectedDepartment, onSelect }) => {
  return (
    <div className="department-selector">
      <h3>Your Departments</h3>
      <select
        className="department-select"
        value={selectedDepartment ? selectedDepartment.id_departement : ""}
        onChange={(e) => {
          const deptId = e.target.value;
          const dept = departments.find(
            (d) => d.id_departement.toString() === deptId
          );
          onSelect(dept);
        }}
      >
        <option value="">Select a department</option>
        {departments.map((dept) => (
          <option key={dept.id_departement} value={dept.id_departement}>
            {dept.nom}
          </option>
        ))}
      </select>
    </div>
  );
};

// SubDepartment selector component
const SubDepartmentSelector = ({
  subDepartments,
  selectedSubDepartment,
  onSelect,
}) => {
  return (
    <div className="subdepartment-selector">
      <h3>Sub-Departments</h3>
      <select
        className="subdepartment-select"
        value={
          selectedSubDepartment ? selectedSubDepartment.id_sous_departement : ""
        }
        onChange={(e) => {
          const subDeptId = e.target.value;
          const subDept = subDepartments.find(
            (sd) => sd.id_sous_departement.toString() === subDeptId
          );
          onSelect(subDept);
        }}
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
  );
};

// Component for the search bar in the header
const SearchBar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = () => {
    onSearch(searchTerm);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="Search..."
        className="search-input"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <button className="search-button" onClick={handleSearch}>
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
const DocumentItem = ({ file, onSelect, isSelected }) => {
  // Add this at the beginning of the DocumentItem component
  console.log("File properties:", {
    id: file.id_fichier,
    name: file.nom_fichier,
    date: file.date_creation,
    size: file.size,
    priority: file.priorite,
  });
  // Get priority indicator color based on file.priorite
  const getPriorityClass = () => {
    if (!file.priorite) return "";

    switch (file.priorite) {
      case 1:
        return "priority-user";
      case 2:
        return "priority-admin";
      case 3:
        return "priority-superadmin";
      default:
        return "";
    }
  };

  // Get priority label based on file.priorite
  const getPriorityLabel = () => {
    if (!file.priorite) return "";

    switch (file.priorite) {
      case 1:
        return "User";
      case 2:
        return "Admin";
      case 3:
        return "Super Admin";
      default:
        return "";
    }
  };
  // Format date if it's provided as a string
  // Update the formatDate function in DocumentItem component
  const formatDate = (dateString) => {
    if (!dateString) return "Date not available";

    try {
      // Check if dateString is already a Date object
      const date =
        dateString instanceof Date ? dateString : new Date(dateString);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.log("Invalid date:", dateString);
        return "Invalid date";
      }

      // Format the date
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return "Date error";
    }
  };

  // Get file name - handle different formats from database or API
  const getFileName = () => {
    if (file.nom_fichier) return file.nom_fichier;
    if (file.name) return file.name;
    if (file.originalName) return file.originalName;
    return "Unnamed file";
  };

  // Get file size - usually not stored in database, so show default
  const getFileSize = () => {
    if (file.size) {
      // Format the size from bytes to KB or MB
      const bytes = file.size;
      if (bytes < 1024) {
        return `${bytes} B`;
      } else if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(2)} KB`;
      } else {
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
      }
    }
    return "Size unknown"; // Fallback
  };
  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return "Unknown";

    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(2)} KB`;
    } else {
      return `${(kb / 1024).toFixed(2)} MB`;
    }
  };
  return (
    <div
      className={`document-item ${
        isSelected ? "selected" : ""
      } ${getPriorityClass()}`}
    >
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
          <div className="document-name">{getFileName()}</div>
          <div className="document-size">{getFileSize()}</div>
        </div>
      </div>

      <div className="document-meta">
        <div className="document-date">
          {formatDate(file.date_creation || file.date)}
        </div>
        <div className="document-status">
          {file.priorite && (
            <span className="document-priority">{getPriorityLabel()}</span>
          )}
          <span>Encrypted</span>
        </div>
        <button className="document-select-btn" onClick={() => onSelect(file)}>
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

const FilePreview = ({ selectedFile }) => {
  const [blockchainService, setBlockchainService] = useState(null);
  const [blockchainMetadata, setBlockchainMetadata] = useState(null);
  const [retrievalError, setRetrievalError] = useState(null);
  const [decryptionStatus, setDecryptionStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [web3Instance, setWeb3Instance] = useState(null);
  // Helper function to check if user has permission to access a file based on priority

  // Get priority label based on file.priorite
  const getPriorityLabel = () => {
    if (!selectedFile || !selectedFile.priorite) return "";

    switch (selectedFile.priorite) {
      case 1:
        return "User";
      case 2:
        return "Admin";
      case 3:
        return "Super Admin";
      default:
        return "";
    }
  };
  // Initialize blockchain service and Web3 when component mounts
  useEffect(() => {
    const initBlockchainService = async () => {
      try {
        // Initialize Web3
        const web3 = new Web3("http://127.0.0.1:7545"); // Use your Ganache URL
        setWeb3Instance(web3);

        const service = new BlockchainService();
        const connected = await service.initMetaMask();
        if (connected) {
          setBlockchainService(service);
          console.log("MetaMask connected successfully");
        } else {
          console.error("Failed to connect to MetaMask");
          setRetrievalError(
            "Failed to connect to MetaMask. Please make sure it's installed and unlocked."
          );
        }
      } catch (error) {
        console.error("Blockchain connection error:", error);
        setRetrievalError(`Failed to connect to blockchain: ${error.message}`);
      }
    };

    initBlockchainService();
  }, []);

  // Reset states when selected file changes
  useEffect(() => {
    if (selectedFile) {
      setBlockchainMetadata(null);
      setRetrievalError(null);
      setDecryptionStatus(null);
      setEncryptionKey(null);
    }
  }, [selectedFile]);

  // Retrieve blockchain metadata when a file is selected
  useEffect(() => {
    const retrieveBlockchainMetadata = async () => {
      if (selectedFile && selectedFile.blockchain_hash && blockchainService) {
        try {
          console.log(
            "Retrieving metadata for hash:",
            selectedFile.blockchain_hash
          );
          // Retrieve metadata from blockchain using file's blockchain hash
          const metadata = await blockchainService.getFileMetadata(
            selectedFile.blockchain_hash
          );
          console.log("Retrieved blockchain metadata:", metadata);
          setBlockchainMetadata(metadata);
          setRetrievalError(null);
        } catch (error) {
          console.error("Blockchain metadata retrieval error:", error);
          setRetrievalError(
            `Failed to retrieve blockchain metadata: ${error.message}`
          );
          setBlockchainMetadata(null);
        }
      }
    };

    if (selectedFile && selectedFile.blockchain_hash && blockchainService) {
      retrieveBlockchainMetadata();
    }
  }, [selectedFile, blockchainService]);

  const handleRetrieveBlockchainKey = async () => {
    // IMMEDIATE DEBUG LOGS

    console.log("Function called with selectedFile:", selectedFile);
    console.log("Function called with selectedFile:", selectedFile);

    if (!selectedFile || !selectedFile.id_fichier) {
      console.log("No file selected");
      setRetrievalError("Please select a file first");
      return;
    }

    setIsProcessing(true);
    setRetrievalError(null);

    try {
      // Get the transaction hash using file ID
      const response = await fetch(
        `http://localhost:5000/retrieveFile/${selectedFile.id_fichier}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Failed to fetch transaction hash from database: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const txHash = data.transactionHash; // Use the correct property name

      if (!txHash) {
        throw new Error("No transaction hash found for this file");
      }

      console.log("Retrieved transaction hash:", txHash);

      // Rest of your code for Web3 interaction...
      const web3 = new Web3("http://127.0.0.1:7545");
      const contractAddress = "0x88f027c730b587AEf84710B0d2fA0420B1016D6E";
      //const contractAddress = '0xfe526fB1A4aF3aDa856925a8ee248a13e772466D';
      const contractABI = [
        {
          inputs: [],
          stateMutability: "nonpayable",
          type: "constructor",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "bytes32",
              name: "fileId",
              type: "bytes32",
            },
          ],
          name: "FileArchived",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "bytes32",
              name: "fileId",
              type: "bytes32",
            },
            {
              indexed: true,
              internalType: "address",
              name: "uploader",
              type: "address",
            },
            {
              indexed: false,
              internalType: "string",
              name: "fileName",
              type: "string",
            },
          ],
          name: "FileRegistered",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "address",
              name: "previousOwner",
              type: "address",
            },
            {
              indexed: true,
              internalType: "address",
              name: "newOwner",
              type: "address",
            },
          ],
          name: "OwnershipTransferred",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "address",
              name: "uploader",
              type: "address",
            },
          ],
          name: "UploaderAdded",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "address",
              name: "uploader",
              type: "address",
            },
          ],
          name: "UploaderRemoved",
          type: "event",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "uploaderAddress",
              type: "address",
            },
          ],
          name: "addUploader",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "bytes32",
              name: "_fileId",
              type: "bytes32",
            },
          ],
          name: "archiveFile",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "bytes32",
              name: "_fileId",
              type: "bytes32",
            },
          ],
          name: "getFileMetadata",
          outputs: [
            {
              components: [
                {
                  internalType: "address",
                  name: "uploader",
                  type: "address",
                },
                {
                  internalType: "uint256",
                  name: "uploadTimestamp",
                  type: "uint256",
                },
                {
                  internalType: "string",
                  name: "fileName",
                  type: "string",
                },
                {
                  internalType: "string",
                  name: "encryptionKeyHash",
                  type: "string",
                },
                {
                  internalType: "bool",
                  name: "isActive",
                  type: "bool",
                },
              ],
              internalType: "struct FileEncryptionRegistry.FileMetadata",
              name: "",
              type: "tuple",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "getUserFiles",
          outputs: [
            {
              internalType: "bytes32[]",
              name: "",
              type: "bytes32[]",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "_address",
              type: "address",
            },
          ],
          name: "isUploader",
          outputs: [
            {
              internalType: "bool",
              name: "",
              type: "bool",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "owner",
          outputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "string",
              name: "_fileName",
              type: "string",
            },
            {
              internalType: "string",
              name: "_encryptionKeyHash",
              type: "string",
            },
          ],
          name: "registerFile",
          outputs: [
            {
              internalType: "bytes32",
              name: "",
              type: "bytes32",
            },
          ],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "uploaderAddress",
              type: "address",
            },
          ],
          name: "removeUploader",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [],
          name: "totalFiles",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "newOwner",
              type: "address",
            },
          ],
          name: "transferOwnership",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
          ],
          name: "userProfiles",
          outputs: [
            {
              internalType: "bool",
              name: "isUploader",
              type: "bool",
            },
            {
              internalType: "uint256",
              name: "totalFilesUploaded",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ];
      const transaction = await web3.eth.getTransaction(txHash);

      // Create contract instance
      const contract = new web3.eth.Contract(contractABI, contractAddress);

      // Check if txHash is valid
      if (!txHash || !web3.utils.isHexStrict(txHash)) {
        throw new Error("Invalid transaction hash retrieved from database");
      }

      try {
        console.log("Attempting to get transaction with hash:", txHash);

        // Get transaction details
        let transaction;
        try {
          transaction = await web3.eth.getTransaction(txHash);
          console.log("Transaction retrieved:", transaction);
        } catch (txError) {
          console.error("Error getting transaction:", txError);
          throw new Error(`Error retrieving transaction: ${txError.message}`);
        }

        if (!transaction) {
          console.error("Transaction not found");
          throw new Error(
            `Transaction with hash ${txHash} not found on the blockchain`
          );
        }

        try {
          const receipt = await web3.eth.getTransactionReceipt(txHash);
          console.log("Transaction receipt:", receipt);
        } catch (receiptError) {
          console.warn(
            "Failed to get transaction receipt, but continuing:",
            receiptError
          );
        }

        console.log("\n📦 Transaction Information:");
        console.log("=======================");
        console.log(`Hash: ${transaction.hash}`);
        console.log(`Block Number: ${transaction.blockNumber}`);
        console.log(`From: ${transaction.from}`);
        console.log(`To: ${transaction.to}`);
        console.log(
          `Input data length: ${
            transaction.input ? transaction.input.length : "N/A"
          }`
        );

        // Decode the input data - make sure the input data exists and has enough length
        if (!transaction.input || transaction.input.length < 10) {
          console.error(
            "Transaction input data is missing or invalid:",
            transaction.input
          );

          // FALLBACK: If blockchain call fails, use the data from the database if it's already in key format
          if (
            data.encryptionKey &&
            typeof data.encryptionKey === "string" &&
            (data.encryptionKey.startsWith("{") ||
              data.encryptionKey.includes('":"'))
          ) {
            console.log(
              "Using encryption key directly from database as fallback"
            );
            setEncryptionKey(data.encryptionKey);
            setDecryptionStatus(
              "Key retrieved from database (blockchain access failed)"
            );
            return;
          }

          throw new Error("Transaction input data is missing or invalid");
        }

        try {
          const inputData = transaction.input.slice(10);
          console.log(
            "Input data for decoding:",
            inputData.substring(0, 100) + "..."
          );

          const decodedParameters = web3.eth.abi.decodeParameters(
            ["string", "string"],
            inputData
          );

          console.log("\n📄 Decoded Input Data:");
          console.log("===================");
          console.log(`File Name: ${decodedParameters[0]}`);
          console.log(
            `Encryption Key: ${
              decodedParameters[1]
                ? decodedParameters[1].substring(0, 20) + "..."
                : "N/A"
            }`
          );

          // Store the actual encryption key
          setEncryptionKey(decodedParameters[1]);
          setDecryptionStatus("Key retrieved successfully");
          alert(
            "Success! Encryption key retrieved. You can now decrypt the file."
          );
        } catch (decodeError) {
          console.error("Error decoding parameters:", decodeError);
          throw new Error(
            `Failed to decode transaction data: ${decodeError.message}`
          );
        }
      } catch (error) {
        console.error("Transaction retrieval error:", error);
        alert(`Error: ${error.message}`);
        throw new Error(
          `Failed to retrieve or decode transaction: ${error.message}`
        );
      }
    } catch (error) {
      console.error("❌ Error:", error);
      console.error("Error Details:", error.message);
      setRetrievalError(`Failed to retrieve encryption key: ${error.message}`);
      setDecryptionStatus(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecryptAndDownload = async () => {
    try {
      setIsProcessing(true);
      setRetrievalError(null);

      // Get metadata and IV
      const metadataResponse = await fetch(
        `http://localhost:5000/retrieveFile/${selectedFile.id_fichier}`
      );
      if (!metadataResponse.ok) {
        const errorText = await metadataResponse.text();
        throw new Error(
          `Failed to retrieve file metadata (${metadataResponse.status}): ${errorText}`
        );
      }
      const metadata = await metadataResponse.json();
      console.log("Complete file metadata:", metadata);
      console.log("Blob URL format:", metadata.blobUrl);

      // Log metadata for debugging
      console.log("Retrieved metadata:", {
        iv: metadata.iv,
        ivLength: metadata.iv ? metadata.iv.length : 0,
        key: encryptionKey ? encryptionKey.substring(0, 20) + "..." : "missing",
      });

      if (!metadata.iv || !encryptionKey) {
        throw new Error("Missing IV or encryption key");
      }

      // Get the encrypted file
      const fileResponse = await fetch(
        `http://localhost:5000/downloadFile/${selectedFile.id_fichier}`
      );

      if (!fileResponse.ok) {
        let errorDetail;
        try {
          const errorJson = await fileResponse.json();
          errorDetail =
            errorJson.message || errorJson.details || JSON.stringify(errorJson);
        } catch (parseError) {
          errorDetail = await fileResponse.text();
        }

        throw new Error(
          `Failed to download encrypted file (${fileResponse.status}): ${errorDetail}`
        );
      }

      const encryptedBlob = await fileResponse.blob();

      // Attempt decryption
      const decryptedFile = await decryptFile(
        encryptedBlob,
        encryptionKey,
        metadata.iv
      );

      // Download the decrypted file
      const originalFileName = selectedFile.nom_fichier.replace(
        ".encrypted",
        ""
      );
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(decryptedFile);
      downloadLink.download = originalFileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setDecryptionStatus("File decrypted and downloaded successfully");
    } catch (error) {
      console.error("Decryption process error:", error);
      setRetrievalError(`Decryption failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  // Get file name - handle different formats from database or API
  const getFileName = () => {
    if (!selectedFile) return "Select a file";
    if (selectedFile.nom_fichier) return selectedFile.nom_fichier;
    if (selectedFile.name) return selectedFile.name;
    if (selectedFile.originalName) return selectedFile.originalName;
    return "Unnamed file";
  };

  // Get file size - usually not stored in database, so show default
  const getFileSize = () => {
    if (!selectedFile) return "";
    if (selectedFile.size) return selectedFile.size;
    return "Unknown size";
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

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

      <div className="preview-filename">{getFileName()}</div>
      <div className="preview-filesize">{getFileSize()}</div>

      {selectedFile && (
        <>
          <div className="file-details">
            {selectedFile.date_creation && (
              <div className="file-detail">
                <span className="detail-label">Uploaded:</span>
                <span className="detail-value">
                  {formatDate(selectedFile.date_creation)}
                </span>
              </div>
            )}
            {selectedFile.priorite && (
              <div className="file-detail">
                <span className="detail-label">Priority:</span>
                <span className="detail-value">{getPriorityLabel()}</span>
              </div>
            )}
            {selectedFile.sous_departement_name && (
              <div className="file-detail">
                <span className="detail-label">Sub-Department:</span>
                <span className="detail-value">
                  {selectedFile.sous_departement_name}
                </span>
              </div>
            )}

            {selectedFile.departement_name && (
              <div className="file-detail">
                <span className="detail-label">Department:</span>
                <span className="detail-value">
                  {selectedFile.departement_name}
                </span>
              </div>
            )}

            {selectedFile.uploaded_by_name && (
              <div className="file-detail">
                <span className="detail-label">Uploaded by:</span>
                <span className="detail-value">
                  {selectedFile.uploaded_by_name}
                </span>
              </div>
            )}

            {selectedFile.chemin_stockage && (
              <div className="file-detail">
                <span className="detail-label">Storage:</span>
                <span className="detail-value">Azure Cloud</span>
              </div>
            )}

            {selectedFile.blockchain_hash && (
              <div className="file-detail">
                <span className="detail-label">Blockchain Hash:</span>
                <span className="detail-value">{`${selectedFile.blockchain_hash.substring(
                  0,
                  8
                )}...`}</span>
              </div>
            )}
          </div>

          {retrievalError && (
            <div className="error-message">{retrievalError}</div>
          )}
          {decryptionStatus && (
            <div className="success-message">{decryptionStatus}</div>
          )}

          <button
            className="btn-retrieve"
            onClick={handleRetrieveBlockchainKey}
          >
            {isProcessing && decryptionStatus !== "Key retrieved successfully"
              ? "Retrieving key..."
              : "Retrieve key from blockchain"}
          </button>

          <button className="btn-decrypt" onClick={handleDecryptAndDownload}>
            {isProcessing && decryptionStatus === "Key retrieved successfully"
              ? "Decrypting..."
              : "Decrypt and download"}
          </button>
        </>
      )}
    </div>
  );
};

// Main app component
const Import = () => {
  // State variables
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [subDepartments, setSubDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedSubDepartment, setSelectedSubDepartment] = useState(null);
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const userCanAccessFile = (file) => {
    console.log("Checking file access:", {
      fileName: file.nom_fichier || file.name,
      filePriority: file.priorite,
      userRole: userRole,
    });
    // If file has no priority, default to allowing access
    if (!file.priorite) return true;

    // User role permission mapping:
    // User role can only access User priority (1)
    // Admin role can access User and Admin priorities (1, 2)
    // Super Admin role can access all priorities (1, 2, 3)

    switch (userRole) {
      case "superadmin":
        return true; // Super admin can access all files
      case "admin":
        return file.priorite <= 2; // Admin can access User and Admin priority files
      case "user":
      default:
        return file.priorite === 1; // Regular users can only access User priority files
    }
  };
  // Filter files based on search term and user role (priority access)
  useEffect(() => {
    // First filter by user role/priority
    const accessibleFiles = files.filter((file) => userCanAccessFile(file));

    // Then filter by search term if provided
    if (!searchTerm) {
      setFilteredFiles(accessibleFiles);
    } else {
      const filtered = accessibleFiles.filter((file) => {
        const fileName = file.nom_fichier || file.name || "";
        return fileName.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredFiles(filtered);
    }
  }, [files, searchTerm, userRole]);

  // Fetch user info and departments on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userString = localStorage.getItem("user");
        if (!userString) {
          console.error("User not found in localStorage");
          setLoading(false);
          setError("User not found. Please log in again.");
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
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
        setError(
          "Error loading user data. Please refresh the page or log in again."
        );
      }
    };

    fetchUserData();
  }, []);

  // Fetch sub-departments when a department is selected
  useEffect(() => {
    if (selectedDepartment) {
      fetchSubDepartments(selectedDepartment.id_departement);
    } else {
      setSubDepartments([]);
      setSelectedSubDepartment(null);
    }
  }, [selectedDepartment]);

  // Fetch files when a sub-department is selected
  useEffect(() => {
    if (selectedSubDepartment) {
      fetchFiles(selectedSubDepartment.id_sous_departement);
    } else {
      setFiles([]);
      setFilteredFiles([]);
    }
  }, [selectedSubDepartment]);

  // Filter files based on search term

  // Functions to fetch departments based on user role
  const fetchSuperAdminDepartments = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/superadmin/${id}/departments`
      );

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      setDepartments(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching superadmin departments:", error);
      setDepartments([]);
      setLoading(false);
      setError(`Error loading departments: ${error.message}`);
    }
  };

  const fetchAdminDepartments = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/admin/${id}/departments`
      );

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      setDepartments(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching admin departments:", error);
      setDepartments([]);
      setLoading(false);
      setError(`Error loading departments: ${error.message}`);
    }
  };

  const fetchUserDepartments = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/user/${id}/departments`
      );

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      setDepartments(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user departments:", error);
      setDepartments([]);
      setLoading(false);
      setError(`Error loading departments: ${error.message}`);
    }
  };

  // Function to fetch sub-departments for a department
  const fetchSubDepartments = async (departmentId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/departments/${departmentId}/sousdepartments`
      );

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      setSubDepartments(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching sub-departments:", error);
      setSubDepartments([]);
      setLoading(false);
      setError(`Error loading sub-departments: ${error.message}`);
    }
  };

  // Function to fetch files for a sub-department
  const fetchFiles = async (subDepartmentId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/files/sousdepartment/${subDepartmentId}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch files: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Files fetched from database:", data);

      if (Array.isArray(data) && data.length > 0) {
        // Successfully received files from the database
        setFiles(data);
        setFilteredFiles(data);
      } else {
        // No files found for this sub-department
        setFiles([]);
        setFilteredFiles([]);
        console.log("No files found for sub-department ID:", subDepartmentId);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      setError(`Error loading files: ${error.message}`);
      setFiles([]);
      setFilteredFiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection
  const handleSelectFile = (file) => {
    setSelectedFile(file);
  };

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  // Handle department selection
  const handleSelectDepartment = (department) => {
    setSelectedDepartment(department);
    setSelectedSubDepartment(null);
    setSelectedFile(null);
  };

  // Handle sub-department selection
  const handleSelectSubDepartment = (subDepartment) => {
    setSelectedSubDepartment(subDepartment);
    setSelectedFile(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="app-container import-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading user data and departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container import-page">
      {/* Header */}
      <header className="app-header">
        <Logo />
        <SearchBar onSearch={handleSearch} />
        <DropDownMenu />
      </header>

      {/* Main content */}
      <div className="app-content">
        {/* Left side - Department selection */}
        <div className="sidebar">
          <DepartmentSelector
            departments={departments}
            selectedDepartment={selectedDepartment}
            onSelect={handleSelectDepartment}
          />

          {selectedDepartment && (
            <SubDepartmentSelector
              subDepartments={subDepartments}
              selectedSubDepartment={selectedSubDepartment}
              onSelect={handleSelectSubDepartment}
            />
          )}
        </div>

        {/* Middle - File list */}
        <div className="file-list-container">
          <h2 className="section-title">IMPORT</h2>
          <p className="section-description">
            Select a file to securely import and decrypt from the cloud
          </p>

          {error && <div className="error-message">{error}</div>}

          {!selectedSubDepartment ? (
            <div className="no-selection-message">
              Please select a department and sub-department to view files
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="no-files-message">
              {files.length === 0
                ? "No files found in this sub-department"
                : "No files found matching your access level or search criteria"}
            </div>
          ) : (
            <div className="document-list">
              {filteredFiles.map((file, index) => (
                <DocumentItem
                  key={index}
                  file={file}
                  onSelect={handleSelectFile}
                  isSelected={
                    selectedFile &&
                    ((selectedFile.id_fichier &&
                      file.id_fichier &&
                      selectedFile.id_fichier === file.id_fichier) ||
                      (selectedFile.name &&
                        file.name &&
                        selectedFile.name === file.name))
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Right side - File preview */}
        <div className="preview-container">
          <FilePreview selectedFile={selectedFile} />
        </div>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        ©2025 secure document vault. Contact email ahdfk@gmail.com
      </footer>
    </div>
  );
};

export default Import;
