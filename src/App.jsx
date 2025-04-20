import { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import HomePage from "./Components/HomePage";
import SignIn from "./Components/SignIn";
import SignUp from "./Components/SignUp";
import UploadImport from "./Components/UploadImport";
import Import from "./Components/Import";
import Upload from "./Components/Upload";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />}></Route>
        <Route path="/SignIn" element={<SignIn />}></Route>
        <Route path="/SignUp" element={<SignUp />}></Route>
        <Route path="/UploadImport" element={<UploadImport />}></Route>
        <Route path="/Import" element={<Import />}></Route>
        <Route path="/Upload" element={<Upload />}></Route>
      </Routes>
    </Router>
  );
}

export default App;
