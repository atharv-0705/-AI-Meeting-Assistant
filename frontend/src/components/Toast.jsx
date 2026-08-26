import { useEffect, useState } from "react";
import "./Toast.css";

export default function Toast({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) return undefined;

    // Trigger entrance animation
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(), 200); // wait for exit animation
    }, 4000);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      className={`toast toast--${toast.type || "success"} ${visible ? "toast--visible" : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="toast-icon">
        {toast.type === "error" ? "✕" : "✓"}
      </span>
      <span className="toast-message">{toast.message}</span>
    </div>
  );
}
