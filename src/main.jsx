import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import SpectatorPage from "./pages/SpectatorPage";
import AdminPage from "./pages/AdminPage";
import AdminGate from "./pages/AdminGate";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SpectatorPage />} />
        <Route path="/spectator" element={<SpectatorPage />} />
        <Route path="/admin-login" element={<AdminGate />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);