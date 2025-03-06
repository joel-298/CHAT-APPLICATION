import React from "react";
import { Routes, Route } from "react-router-dom";
import './App.css';
import Home from "./Pages/Home";
import Signup from "./Pages/Signup";
import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import NotFound from "./Pages/NotFound";
// import Profile from "./Pages/Profile";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} /> 
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/*" element={<NotFound/>} />
    </Routes>
  );
}

export default App;
