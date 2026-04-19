import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminGate() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const expected = import.meta.env.VITE_ADMIN_PASSCODE;

  function handleSubmit(e) {
    e.preventDefault();

    if (passcode === expected) {
      sessionStorage.setItem("admin_access", "granted");
      navigate("/admin");
      return;
    }

    setError("Incorrect passcode.");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0f172a",
        color: "white",
        padding: 24,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 360,
          background: "#111827",
          border: "1px solid #334155",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <h1 style={{ marginTop: 0 }}>Admin Login</h1>
        <p style={{ color: "#cbd5e1" }}>Enter passcode to access race controls.</p>

        <input
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Passcode"
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid #475569",
            marginBottom: 12,
            boxSizing: "border-box",
          }}
        />

        {error && (
          <div style={{ color: "#f87171", marginBottom: 12 }}>{error}</div>
        )}

        <button
          type="submit"
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Enter Admin
        </button>
      </form>
    </div>
  );
}