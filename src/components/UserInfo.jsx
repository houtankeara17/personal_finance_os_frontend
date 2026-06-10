import React from "react";

function Row({ label, value, highlight }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: "#999",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 12,
          color: highlight ? "#0066ff" : "#1a1a1a",
          fontWeight: highlight ? 600 : 400,
          maxWidth: 200,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value || "—"}
      </span>
    </div>
  );
}

export default function UserInfo({ user }) {
  const initial = user?.name?.[0]?.toUpperCase() || "?";

  return (
    <div
      style={{
        border: "1px solid #e8e8e8",
        borderRadius: 10,
        padding: 18,
        background: "#fff",
      }}
    >
      <p
        style={{
          fontSize: 10,
          color: "#bbb",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: 14,
          margin: "0 0 14px",
        }}
      >
        Account
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          paddingBottom: 14,
          borderBottom: "1px solid #f0f0f0",
          marginBottom: 6,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "#f0f5ff",
            border: "1px solid #d0e0ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 700,
            color: "#0066ff",
            flexShrink: 0,
          }}
        >
          {initial}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>
            {user?.name || "—"}
          </div>
          <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
            {user?.email || "—"}
          </div>
        </div>
      </div>

      <Row label="Currency" value={user?.currency || "USD"} highlight />
      <Row label="Theme" value={user?.theme || "default"} />
      <Row
        label="User ID"
        value={user?._id ? `${user._id.slice(0, 8)}…` : "—"}
      />
    </div>
  );
}
