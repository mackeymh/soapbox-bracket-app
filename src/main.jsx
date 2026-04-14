import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import AdminPage from "./pages/AdminPage";
import SpectatorPage from "./pages/SpectatorPage";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/spectator" element={<SpectatorPage />} />
        <Route path="*" element={<Navigate to="/spectator" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);