import React, { useState, useEffect } from "react";
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
// Component for the document item in the list - updated to handle database file records
const DocumentItem = ({ file, onSelect, isSelected }) => {
  // Format date if it's provided as a string
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return as is if can't be parsed
      }
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString; // Return as is if any error occurs
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
    if (file.size) return file.size;
    return "Unknown size";
  };

  return (
    <div className={`document-item ${isSelected ? "selected" : ""}`}>
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
        <div className="document-status">Encrypted</div>
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

// Component for the file preview on the right side
// Component for the file preview on the right side - updated for database records
const FilePreview = ({ selectedFile }) => {
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
        year: "numeric"
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
                <span className="detail-value">{formatDate(selectedFile.date_creation)}</span>
              </div>
            )}
            
            {selectedFile.sous_departement_name && (
              <div className="file-detail">
                <span className="detail-label">Sub-Department:</span>
                <span className="detail-value">{selectedFile.sous_departement_name}</span>
              </div>
            )}
            
            {selectedFile.departement_name && (
              <div className="file-detail">
                <span className="detail-label">Department:</span>
                <span className="detail-value">{selectedFile.departement_name}</span>
              </div>
            )}
            
            {selectedFile.uploaded_by_name && (
              <div className="file-detail">
                <span className="detail-label">Uploaded by:</span>
                <span className="detail-value">{selectedFile.uploaded_by_name}</span>
              </div>
            )}
            
            {selectedFile.chemin_stockage && (
              <div className="file-detail">
                <span className="detail-label">Storage:</span>
                <span className="detail-value">Azure Cloud</span>
              </div>
            )}
          </div>
          
          <button className="btn-retrieve">Retrieve key from blockchain</button>
          <button className="btn-decrypt">decrypt and download</button>
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

  // Sample data for demo if needed
  const sampleFiles = [
    { name: "report.pdf", size: "35.5 ko", date: "29 fev,2025" },
    { name: "presentati.pdf", size: "35.5 ko", date: "29 fev,2025" },
    { name: "cv.txt", size: "35.5 ko", date: "29 fev,2025" },
    { name: "contrat.word", size: "35.5 ko", date: "29 fev,2025" },
    { name: "rapport.pdf", size: "35.5 ko", date: "29 fev,2025" },
  ];

  // Fetch user info and departments on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userString = localStorage.getItem("user");
        if (!userString) {
          console.error("User not found in localStorage");
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
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
        setError("Error loading user data");
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
  useEffect(() => {
    if (!searchTerm) {
      setFilteredFiles(files);
    } else {
      const filtered = files.filter((file) =>
        (file.nom_fichier || file.name)
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
      setFilteredFiles(filtered);
    }
  }, [files, searchTerm]);

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
        // For demo, use empty array
        setDepartments([]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching superadmin departments:", error);
      setDepartments([]);
      setLoading(false);
      setError("Error loading departments");
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
        // For demo, use empty array
        setDepartments([]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching admin departments:", error);
      setDepartments([]);
      setLoading(false);
      setError("Error loading departments");
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
        // For demo, use empty array
        setDepartments([]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user departments:", error);
      setDepartments([]);
      setLoading(false);
      setError("Error loading departments");
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
      } else {
        console.error("Failed to fetch sub-departments");
        setSubDepartments([]);
      }
    } catch (error) {
      console.error("Error fetching sub-departments:", error);
      setSubDepartments([]);
      setError("Error loading sub-departments");
    }
  };

  // Function to fetch files for a sub-department
  // Function to fetch files for a sub-department - updated to handle actual database records
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
              No files found in this sub-department
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
