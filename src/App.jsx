import { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import HomePage from "./Components/HomePage";
import SignIn from "./Components/LogIn";
import SignUp from "./Components/SignUp";
import UploadImport from "./Components/UploadImport";
import Import from "./Components/Import";
import Upload from "./Components/Upload";
import ProtectedRoute from "./Components/ProtectedRoutes";
import Department from "./Components/Departement.jsx";  

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />}></Route>
        <Route path="/SignIn" element={<SignIn />}></Route>
        <Route path="/SignUp" element={<SignUp />}></Route>
        <Route
          path="/uploadimport"
          element={
            <ProtectedRoute>
              <UploadImport />
            </ProtectedRoute>
          }
        />

        <Route
          path="/Import"
          element={
            <ProtectedRoute>
              <Import />
            </ProtectedRoute>
          }
        ></Route>
        <Route
          path="/Upload"
          element={
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          }
        ></Route>
        <Route
          path="/departements"
          element={<ProtectedRoute>
            <Department />  
          </ProtectedRoute>}
        ></Route>
      </Routes>
    </Router>
  );
}

export default App;
