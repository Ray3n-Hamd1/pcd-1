import React, { useState, useEffect } from "react";
import axios from "axios";
import "./departement.css"; // Import your CSS file for styling
import DropDownMenu from "./DropDownMenu";

const Department = () => {
  axios.defaults.baseURL = "http://localhost:5000";

  // State management
  const [requestSentToSousDepartment, setRequestSentToSousDepartment] =
    useState({});
  const [newDeptName, setNewDeptName] = useState("");
  const [adminManagedDepartments, setAdminManagedDepartments] = useState([]);
  const [newDeptDesc, setNewDeptDesc] = useState("");
  const [newSousDeptDesc, setNewSousDeptDesc] = useState("");
  const [newSousDeptName, setNewSousDeptName] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [userRole, setUserRole] = useState(""); // 'superadmin', 'admin', 'user'
  const [departments, setDepartments] = useState([]);
  const [sousDepartments, setSousDepartments] = useState([]);
  const [userDepartments, setUserDepartments] = useState([]);
  const [userSousDepartments, setUserSousDepartments] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [requestSentToDepartment, setRequestSentToDepartment] = useState({});

  // Fetch user data on component mount
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

        if (user.role === "superadmin") {
          fetchSuperAdminData(user.id);
        } else if (user.role === "admin") {
          fetchAdminData(user.id);
        } else {
          fetchUserDataForRegularUser(user.id);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);
  useEffect(() => {
    // Only fetch join requests when userId is available and user is an admin
    if (userId && userRole === "admin") {
      fetchExistingJoinRequests();
    }
  }, [userId, userRole]);
  // Data fetching functions
  // Add this function to your Department.jsx component
  const fetchUserDataForRegularUser = async (userId) => {
    try {
      console.log("Fetching regular user data for user ID:", userId);

      // Get all departments for reference
      const allDeptResponse = await axios.get("/api/departments");
      setDepartments(allDeptResponse.data);
      console.log("All departments loaded:", allDeptResponse.data.length);

      // Get all sous-departments
      const allSousDeptResponse = await axios.get("/api/sousdepartments");
      setSousDepartments(allSousDeptResponse.data);
      console.log(
        "All sous-departments loaded:",
        allSousDeptResponse.data.length
      );

      // Get departments this user belongs to
      const userDeptResponse = await axios.get(
        `/api/users/${userId}/departments`
      );
      setUserDepartments(userDeptResponse.data);
      console.log("User departments loaded:", userDeptResponse.data.length);

      // Get sous-departments this user belongs to
      const userSousDeptResponse = await axios.get(
        `/api/users/${userId}/sousdepartments`
      );
      setUserSousDepartments(userSousDeptResponse.data);
      console.log(
        "User sous-departments loaded:",
        userSousDeptResponse.data.length
      );
    } catch (error) {
      console.error("Error fetching regular user data:", error);
      throw error; // Rethrow to be caught by the caller
    }
  };
  const fetchSuperAdminData = async (userId) => {
    try {
      const deptResponse = await axios.get("/api/departments");
      const sousDeptResponse = await axios.get("/api/sousdepartments");
      const userDeptResponse = await axios.get(
        `/api/users/${userId}/departments`
      );
      const adminJoinRequestsResponse = await axios.get(
        "/api/join-requests/departments/pending"
      );

      setDepartments(deptResponse.data);
      setSousDepartments(sousDeptResponse.data);
      setUserDepartments(userDeptResponse.data);
      setJoinRequests(adminJoinRequestsResponse.data);
    } catch (error) {
      console.error("Error fetching superadmin data:", error);
    }
  };
  const fetchExistingJoinRequests = async () => {
    try {
      if (!userId || isNaN(parseInt(userId, 10))) {
        console.error("Invalid userId for fetching join requests:", userId);
        return;
      }

      const response = await axios.get(
        `/api/join-requests?userId=${userId}&status=pending`
      );

      // Create objects to track which departments and sous-departments have pending requests
      const pendingDeptRequests = {};
      const pendingSousDeptRequests = {};

      response.data.forEach((request) => {
        if (request.type_demande === "department" && request.id_departement) {
          pendingDeptRequests[request.id_departement] = true;
        } else if (
          request.type_demande === "sous_department" &&
          request.id_sous_departement
        ) {
          pendingSousDeptRequests[request.id_sous_departement] = true;
        }
      });

      setRequestSentToDepartment(pendingDeptRequests);
      setRequestSentToSousDepartment(pendingSousDeptRequests);
    } catch (error) {
      console.error("Error fetching existing join requests:", error);
    }
  };
  // Replace your fetchAdminData function with this version
  const fetchAdminData = async (userId) => {
    try {
      // Get all departments for reference
      const allDeptResponse = await axios.get("/api/departments");
      setDepartments(allDeptResponse.data);

      // Get departments managed by this admin (added or modified)
      const adminDeptResponse = await axios.get(
        `/api/admin/${userId}/managed-departments`
      );
      setAdminManagedDepartments(adminDeptResponse.data);

      // Get sous-departments where user is an admin
      const adminSousDeptResponse = await axios.get(
        `/api/admin/${userId}/sousdepartments`
      );

      // Get join requests for the admin's sous-departments
      // Check in your fetchAdminData function
      const userJoinRequestsResponse = await axios.get(
        `/api/admin/${userId}/sousdepartments/joinrequests`
      );
      console.log("Join requests loaded:", userJoinRequestsResponse.data);
      setJoinRequests(userJoinRequestsResponse.data);

      setUserDepartments(adminDeptResponse.data);
      setUserSousDepartments(adminSousDeptResponse.data);
      setJoinRequests(userJoinRequestsResponse.data);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      // Your error handling code
    }
  };
  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    try {
      const userString = localStorage.getItem("user");
      const user = JSON.parse(userString);
      const currentUserId = user ? user.id : null;

      if (!currentUserId) {
        console.error("User ID not found.");
        alert("User ID not found. Please log in again.");
        return;
      }

      const response = await axios.post("/api/departments", {
        nom: newDeptName,
        description: newDeptDesc,
        userId: currentUserId, // Send the user ID in the request body
      });

      setDepartments([...departments, response.data]);
      setUserDepartments([...userDepartments, response.data]); // Update the superadmin's department list immediately
      setNewDeptName("");
      setNewDeptDesc("");
      alert("Department created successfully!");
    } catch (error) {
      console.error("Error creating department:", error);
    }
  };

  const handleCreateSousDepartment = async (e) => {
    e.preventDefault();
    try {
      // Get the current user's ID from localStorage
      const userString = localStorage.getItem("user");
      const user = JSON.parse(userString);
      const currentUserId = user ? user.id : null;

      const response = await axios.post("/api/sousdepartments", {
        nom: newSousDeptName,
        description: newSousDeptDesc,
        id_departement: selectedDepartment,
        userId: currentUserId, // Add the current user's ID
      });

      setSousDepartments([...sousDepartments, response.data]);
      setNewSousDeptName("");
      setNewSousDeptDesc("");
      alert("Sous-department created successfully!");
    } catch (error) {
      console.error("Error creating sous-department:", error);
      alert("Error creating sous-department");
    }
  };
  const handleApproveJoinRequest = async (requestId, isApproved) => {
    try {
      const response = await axios.put(`/api/join-requests/${requestId}`, {
        statut: isApproved ? "approved" : "rejected",
      });

      // Remove the processed request from the list
      setJoinRequests((prevRequests) =>
        prevRequests.filter((req) => req.id_demande !== requestId)
      );

      // If approved, add the user to the sous-department
      if (isApproved) {
        const request = joinRequests.find(
          (req) => req.id_demande === requestId
        );

        if (request.type_demande === "sous_department") {
          await axios.post("/api/user-sousdepartment", {
            userId: request.id_utilisateur,
            sousDepartementId: request.id_sous_departement,
          });
        } else if (request.type_demande === "department") {
          await axios.post("/api/user-department", {
            userId: request.id_utilisateur,
            departementId: request.id_departement,
          });
        }
      }

      alert(
        `Join request ${isApproved ? "approved" : "rejected"} successfully`
      );
    } catch (error) {
      console.error("Error processing join request:", error);
      alert(`Failed to ${isApproved ? "approve" : "reject"} join request`);
    }
  };

  const handleRequestJoinDepartment = async (deptId) => {
    try {
      await axios.post("/api/join-requests", {
        id: userId,
        id_departement: deptId,
        type_demande: "department",
        statut: "pending",
      });
      setRequestSentToDepartment((prev) => ({ ...prev, [deptId]: true }));
      alert("Join request sent successfully");
    } catch (error) {
      console.error("Error sending join request:", error);

      // Check for the specific error about duplicate requests
      if (
        error.response?.data?.error ===
        "A similar pending request already exists"
      ) {
        // If there's already a request, update the UI as if the request was just sent
        setRequestSentToDepartment((prev) => ({ ...prev, [deptId]: true }));
        alert("You already have a pending request for this department");
      } else {
        // For other errors, show the general error message
        alert(
          "Error sending join request: " +
            (error.response?.data?.error || error.message)
        );
      }
    }
  };

  const handleRequestJoinSousDepartment = async (sousDeptId) => {
    try {
      await axios.post("/api/join-requests", {
        id: userId,
        id_sous_departement: sousDeptId,
        type_demande: "sous_department",
        statut: "pending",
      });
      setRequestSentToSousDepartment((prev) => ({
        ...prev,
        [sousDeptId]: true,
      }));
      alert(
        "Join request for sous-department sent successfully! An admin will review your request."
      );
    } catch (error) {
      console.error("Error sending join request:", error);

      // Check for the specific error about duplicate requests
      if (
        error.response?.data?.error ===
        "A similar pending request already exists"
      ) {
        setRequestSentToSousDepartment((prev) => ({
          ...prev,
          [sousDeptId]: true,
        }));
        alert("You already have a pending request for this sous-department");
      } else {
        alert(
          "Error sending join request: " +
            (error.response?.data?.error || error.message)
        );
      }
    }
  };
  const renderSuperAdminView = () => (
    <div className="superadmin-view">
      <h2>Super Admin Dashboard</h2>

      <div className="section">
        <h3>My Departments</h3>
        <ul className="list-group">
          {Array.isArray(userDepartments) &&
            userDepartments.map((dept) => (
              <li key={dept.id_departement} className="list-group-item">
                {dept.nom} - {dept.description}
              </li>
            ))}
        </ul>
      </div>

      <div className="section">
        <h3>Create New Department</h3>
        <form onSubmit={handleCreateDepartment}>
          <div className="form-group">
            <label>Department Name:</label>
            <input
              type="text"
              className="form-control"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea
              className="form-control"
              value={newDeptDesc}
              onChange={(e) => setNewDeptDesc(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary mt-2">
            Create Department
          </button>
        </form>
      </div>

      <div className="section mt-4">
        <h3>Admin Join Requests</h3>
        {joinRequests.filter(
          (req) =>
            req.role_utilisateur === "admin" &&
            req.type_demande === "department"
        ).length > 0 ? (
          <ul className="list-group">
            {joinRequests
              .filter(
                (req) =>
                  req.role_utilisateur === "admin" &&
                  req.type_demande === "department"
              )
              .map((request) => (
                <li
                  key={request.id_demande}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <div>
                    <strong>{request.nom_utilisateur}</strong> (Admin) wants to
                    join department: <strong>{request.nom_departement}</strong>
                  </div>
                  <div>
                    <button
                      className="btn btn-success btn-sm me-2"
                      onClick={() =>
                        handleApproveJoinRequest(request.id_demande, true)
                      }
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() =>
                        handleApproveJoinRequest(request.id_demande, false)
                      }
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        ) : (
          <p>No pending join requests from admins for departments</p>
        )}
      </div>

      <div className="section mt-4">
        <h3>My Departments</h3>
        <ul className="list-group">
          {Array.isArray(userDepartments) &&
            userDepartments.map((dept) => (
              <li key={dept.id_departement} className="list-group-item">
                <h4>{dept.nom}</h4>
                <p>{dept.description}</p>
                <h5>Sous-Departments:</h5>
                <ul>
                  {sousDepartments
                    .filter(
                      (sousDept) =>
                        sousDept.id_departement === dept.id_departement
                    )
                    .map((sousDept) => (
                      <li key={sousDept.id_sous_departement}>
                        {sousDept.nom} - {sousDept.description}
                      </li>
                    ))}
                </ul>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
  const renderAdminView = () => (
    <div className="admin-view">
      <h2>Admin Dashboard</h2>
      <div className="section">
        <h3>My Sous-Departments</h3>
        <ul className="list-group">
          {userSousDepartments.map((sousDept) => {
            const parentDept = departments.find(
              (d) => d.id_departement === sousDept.id_departement
            );
            return (
              <li
                key={sousDept.id_sous_departement}
                className="list-group-item"
              >
                <strong>{sousDept.nom}</strong> - {sousDept.description}
                <p>
                  Parent Department: {parentDept ? parentDept.nom : "Unknown"}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="section mt-4">
        <h3>Create New Sous-Department</h3>
        <form onSubmit={handleCreateSousDepartment}>
          <div className="form-group">
            <label>Department:</label>
            <select
              className="form-control"
              value={selectedDepartment || ""}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              required
            >
              <option value="">Select Department</option>
              {/* Use userDepartments instead of adminManagedDepartments to ensure this works */}
              {Array.isArray(userDepartments) ? (
                userDepartments.map((dept) => (
                  <option key={dept.id_departement} value={dept.id_departement}>
                    {dept.nom}
                  </option>
                ))
              ) : (
                <option disabled>Loading Departments...</option>
              )}
            </select>
          </div>
          <div className="form-group">
            <label>Sous-Department Name:</label>
            <input
              type="text"
              className="form-control"
              value={newSousDeptName}
              onChange={(e) => setNewSousDeptName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea
              className="form-control"
              value={newSousDeptDesc}
              onChange={(e) => setNewSousDeptDesc(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary mt-2">
            Create Sous-Department
          </button>
        </form>
      </div>
      <div className="section mt-4">
        <h3>My Departments</h3>
        {adminManagedDepartments && adminManagedDepartments.length > 0 ? (
          <ul className="list-group">
            {adminManagedDepartments.map((dept) => (
              <li key={dept.id_departement} className="list-group-item">
                <h4>{dept.nom}</h4>
                <p>{dept.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>You don't belong to any departments yet.</p>
        )}
      </div>
      {/* SECTION FOR ADMIN TO JOIN DEPARTMENTS */}
      <div className="section mt-4">
        <h3>Available Departments to Join</h3>
        <ul className="list-group">
          {departments
            .filter(
              (dept) =>
                !adminManagedDepartments.some(
                  (myDept) => myDept.id_departement === dept.id_departement
                )
            )
            .map((dept) => (
              <li key={dept.id_departement} className="list-group-item">
                <h4>{dept.nom}</h4>
                <p>{dept.description}</p>
                <button
                  className="btn btn-outline-primary btn-sm me-2"
                  onClick={() =>
                    handleRequestJoinDepartment(dept.id_departement)
                  }
                  disabled={requestSentToDepartment[dept.id_departement]}
                >
                  {requestSentToDepartment[dept.id_departement]
                    ? "Request Sent"
                    : "Request to Join Department"}
                </button>
              </li>
            ))}
        </ul>
      </div>
      <div className="section mt-4">
        <h3>User Join Requests for Sous-Departments</h3>
        {joinRequests &&
        joinRequests.filter((req) => req.type_demande === "sous_department")
          .length > 0 ? (
          <ul className="list-group">
            {joinRequests
              .filter((req) => req.type_demande === "sous_department")
              .map((request) => (
                <li
                  key={request.id_demande}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <div>
                    <strong>{request.nom_utilisateur}</strong> wants to join
                    sous-department:{" "}
                    <strong>{request.nom_sous_departement}</strong>
                  </div>
                  <div>
                    <button
                      className="btn btn-success btn-sm me-2"
                      onClick={() =>
                        handleApproveJoinRequest(request.id_demande, true)
                      }
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() =>
                        handleApproveJoinRequest(request.id_demande, false)
                      }
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        ) : (
          <p>No pending join requests from users for sous-departments</p>
        )}
      </div>
    </div>
  );

  const renderUserView = () => (
    <div className="user-view">
      <h2>User Dashboard</h2>

      <div className="section">
        <h3>My Sous-Departments</h3>
        {userSousDepartments.length > 0 ? (
          <ul className="list-group">
            {userSousDepartments.map((sousDept) => {
              const parentDept = departments.find(
                (d) => d.id_departement === sousDept.id_departement
              );
              return (
                <li
                  key={sousDept.id_sous_departement}
                  className="list-group-item"
                >
                  <strong>{sousDept.nom}</strong> - {sousDept.description}
                  <p>
                    Parent Department: {parentDept ? parentDept.nom : "Unknown"}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>You're not a member of any sous-departments yet.</p>
        )}
      </div>

      <div className="section mt-4">
        <h3>All Departments and Sous-Departments</h3>
        <ul className="list-group">
          {departments.map((dept) => (
            <li key={dept.id_departement} className="list-group-item">
              <h4>{dept.nom}</h4>
              <p>{dept.description}</p>

              {/* Request to join department button (if not already a member) */}
              {!userDepartments.some(
                (ud) => ud.id_departement === dept.id_departement
              ) && (
                <button
                  className="btn btn-outline-primary btn-sm me-2"
                  onClick={() =>
                    handleRequestJoinDepartment(dept.id_departement)
                  }
                  disabled={requestSentToDepartment[dept.id_departement]}
                >
                  {requestSentToDepartment[dept.id_departement]
                    ? "Request Sent"
                    : "Request to Join Department"}
                </button>
              )}

              <h5>Sous-Departments:</h5>
              <ul>
                {sousDepartments
                  .filter(
                    (sousDept) =>
                      sousDept.id_departement === dept.id_departement
                  )
                  .map((sousDept) => (
                    <li
                      key={sousDept.id_sous_departement}
                      className="list-group-item list-group-item-secondary ms-3"
                    >
                      {sousDept.nom} - {sousDept.description}
                      {!userSousDepartments.some(
                        (usd) =>
                          usd.id_sous_departement ===
                          sousDept.id_sous_departement
                      ) && (
                        <button
                          className="btn btn-outline-info btn-sm ms-2"
                          onClick={() =>
                            handleRequestJoinSousDepartment(
                              sousDept.id_sous_departement
                            )
                          }
                          disabled={
                            requestSentToSousDepartment[
                              sousDept.id_sous_departement
                            ]
                          }
                        >
                          {requestSentToSousDepartment[
                            sousDept.id_sous_departement
                          ]
                            ? "Request Sent"
                            : "Request to Join"}
                        </button>
                      )}
                    </li>
                  ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      <div className="section mt-4">
        <h3>My Departments</h3>
        <ul className="list-group">
          {Array.isArray(userDepartments) &&
            userDepartments.map((dept) => (
              <li key={dept.id_departement} className="list-group-item">
                {dept.nom} - {dept.description}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );

  // Main render
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
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
        <DropDownMenu />
      </header>
      <div className="department-management container mt-4">
        <h1>Department Management</h1>

        {userRole === "superadmin" && renderSuperAdminView()}
        {userRole === "admin" && renderAdminView()}
        {userRole === "user" && renderUserView()}
      </div>
    </div>
  );
};

export default Department;
