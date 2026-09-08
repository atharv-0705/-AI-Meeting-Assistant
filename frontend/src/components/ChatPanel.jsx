import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import "./ChatPanel.css";

export default function ChatPanel({ meetingId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  // Reset chat when meeting changes
  useEffect(() => {
    setMessages([]);
    setInput("");
    setSending(false);
  }, [meetingId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = async () => {
    const question = input.trim();
    if (!question || sending) return;

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setSending(true);

    try {
      const data = await api.chat(meetingId, question);
      setMessages((prev) => [...prev, { role: "assistant", text: data.answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: err.message || "Something went wrong answering that.", isError: true },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (!meetingId) {
    return (
      <div className="card chat-panel">
        <div className="empty-state chat-empty">
          <div className="chat-empty-icon">💬</div>
          <p>This meeting is not ready for chat yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card chat-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Ask</span>
          <h3>Chat with this meeting</h3>
        </div>
      </div>

      <div className="chat-messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="empty-state chat-empty">
            <div className="chat-empty-icon">💬</div>
            Ask anything about this meeting — decisions, owners, deadlines, or anything discussed.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role} ${m.isError ? "chat-bubble--error" : ""}`}>
            {m.text}
          </div>
        ))}
        {sending && (
          <div className="chat-bubble assistant chat-typing">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>

      <div className="chat-input-row">
        <textarea
          className="textarea chat-input"
          rows={1}
          placeholder="Ask a question about this meeting…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
        />
        <button className="chat-send-btn" onClick={send} disabled={sending || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
