import { useState } from "react";
import "./DropDownMenu.css";
import { useNavigate } from "react-router-dom";

export default function DropDownMenu() {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState("Select an option");

  const options = ["profile", "departements", "historique", "logout"];

  const toggleDropdown = () => setIsOpen(!isOpen);
  const handleSelect = (option) => {
    setIsOpen(false);

    if (option === "logout") {
      // Clear localStorage and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/signin");
    } else {
      const routes = {
        profile: "/",
        departements: "/about",
        historique: "/contact",
      };
      navigate(routes[option]);
    }
  };

  return (
    <div className="dropdown-container">
      <button onClick={toggleDropdown} className="dropdown-toggle">
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
          <span className="user-name">{user?.name}</span>
          <span className="dropdown-arrow">▼</span>
        </div>
      </button>

      {isOpen && (
        <ul className="dropdown-menu">
          {options.map((option) => (
            <li
              key={option}
              onClick={() => handleSelect(option)}
              className="dropdown-item"
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
