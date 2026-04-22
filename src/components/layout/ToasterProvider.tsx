"use client";

import { Toaster } from "react-hot-toast";

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "linear-gradient(160deg, rgba(99,102,241,0.1), rgba(17,21,54,0.95))",
          color: "#e2e8f0",
          border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: "14px",
          padding: "12px 16px",
          fontSize: "13px",
          fontFamily: "var(--font-sans)",
          backdropFilter: "blur(12px)",
        },
        success: {
          iconTheme: { primary: "#10b981", secondary: "#06131b" },
        },
        error: {
          iconTheme: { primary: "#ef4444", secondary: "#1a0606" },
        },
      }}
    />
  );
}
