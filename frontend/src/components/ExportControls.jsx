import { useState } from "react";
import { api } from "../services/api";
import "./ExportControls.css";

export default function ExportControls({ meetingId }) {
  const [pending, setPending] = useState(null); // "txt" | "pdf" | null
  const [error, setError] = useState(null);

  const handleExport = async (format) => {
    setPending(format);
    setError(null);
    try {
      const { blob, filename } = await api.exportMeeting(meetingId, format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Failed to export the report.");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="export-controls">
      <button className="btn btn-secondary" onClick={() => handleExport("txt")} disabled={pending !== null}>
        {pending === "txt" ? "Exporting…" : "Export TXT"}
      </button>
      <button className="btn btn-secondary" onClick={() => handleExport("pdf")} disabled={pending !== null}>
        {pending === "pdf" ? "Exporting…" : "Export PDF"}
      </button>
      {error && <span className="export-error">{error}</span>}
    </div>
  );
}
