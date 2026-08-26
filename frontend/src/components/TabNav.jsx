import "./TabNav.css";

const TABS = [
  { id: "summary", label: "Summary", icon: "📊" },
  { id: "transcript", label: "Transcript", icon: "📝" },
  { id: "chat", label: "Chat", icon: "💬" },
  { id: "history", label: "History", icon: "📁" },
];

export default function TabNav({ activeTab, onTabChange }) {
  return (
    <nav className="tab-nav" role="tablist" aria-label="Meeting sections">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`tab-nav-item ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="tab-icon" aria-hidden="true">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
      <span className="tab-nav-indicator" />
    </nav>
  );
}
