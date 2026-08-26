import { useCallback, useEffect, useState } from "react";
import Header from "./components/Header";
import MeetingInput from "./components/MeetingInput";
import ProcessingTimeline from "./components/ProcessingTimeline";
import MeetingDashboard from "./components/MeetingDashboard";
import ChatPanel from "./components/ChatPanel";
import TabNav from "./components/TabNav";
import TranscriptView from "./components/TranscriptView";
import HistoryView from "./components/HistoryView";
import Toast from "./components/Toast";
import { useTheme } from "./hooks/useTheme";
import { useMeetingPolling } from "./hooks/useMeetingPolling";
import { api } from "./services/api";
import "./App.css";

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [backendOnline, setBackendOnline] = useState(null);
  const [meetingId, setMeetingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [toast, setToast] = useState(null);

  const { meeting } = useMeetingPolling(meetingId);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    api
      .health()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  // Fetch summary + transcript when a meeting becomes ready
  useEffect(() => {
    if (meeting?.status !== "ready") return undefined;
    let cancelled = false;
    setLoadingResults(true);
    setAnalysisError(null);

    Promise.all([api.getSummary(meetingId), api.getTranscript(meetingId)])
      .then(([summaryData, transcriptData]) => {
        if (cancelled) return;
        setSummary(summaryData);
        setTranscript(transcriptData);
      })
      .catch((err) => {
        if (!cancelled) setAnalysisError(err.message || "Failed to load meeting results.");
      })
      .finally(() => {
        if (!cancelled) setLoadingResults(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meeting?.status, meetingId]);

  const handleSubmit = useCallback(async ({ type, youtubeUrl, file, language }) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const data =
        type === "youtube"
          ? await api.createMeetingFromUrl(youtubeUrl, language)
          : await api.createMeetingFromFile(file, language);
      setSummary(null);
      setTranscript(null);
      setMeetingId(data.meeting_id);
      setActiveTab("summary");
    } catch (err) {
      setSubmitError(err.message || "Failed to start processing this meeting.");
    } finally {
      setSubmitting(false);
    }
  }, []);

  const handleNewMeeting = () => {
    setMeetingId(null);
    setSummary(null);
    setTranscript(null);
    setSubmitError(null);
    setAnalysisError(null);
    setActiveTab("summary");
  };

  /** Load a historical meeting from the History tab */
  const handleSelectMeeting = useCallback(async (selectedId) => {
    setMeetingId(selectedId);
    setSummary(null);
    setTranscript(null);
    setAnalysisError(null);
    setLoadingResults(true);
    setActiveTab("summary");

    try {
      const [summaryData, transcriptData] = await Promise.all([
        api.getSummary(selectedId),
        api.getTranscript(selectedId),
      ]);
      setSummary(summaryData);
      setTranscript(transcriptData);
    } catch (err) {
      setAnalysisError(err.message || "Failed to load meeting results.");
    } finally {
      setLoadingResults(false);
    }
  }, []);

  const handleToast = useCallback((t) => {
    setToast(t);
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const isReady = meeting?.status === "ready";
  const hasResults = isReady && summary && transcript && !loadingResults;

  const renderTabContent = () => {
    if (!hasResults) return null;

    switch (activeTab) {
      case "summary":
        return (
          <MeetingDashboard
            meeting={meeting}
            summary={summary}
            onToast={handleToast}
          />
        );
      case "transcript":
        return (
          <TranscriptView
            transcript={transcript}
            meetingId={meetingId}
            onToast={handleToast}
          />
        );
      case "chat":
        return <ChatPanel meetingId={meetingId} />;
      case "history":
        return (
          <HistoryView
            onSelectMeeting={handleSelectMeeting}
            activeMeetingId={meetingId}
            onToast={handleToast}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-shell">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        backendOnline={backendOnline}
        onNewMeeting={handleNewMeeting}
        hasActiveMeeting={Boolean(meetingId)}
      />

      <main className="app-main">
        {backendOnline === false && (
          <div className="error-banner" role="alert">
            <span>
              <strong>Backend unavailable.</strong> Start it with{" "}
              <code>uvicorn main:app --port 2210 --reload</code> and refresh.
            </span>
          </div>
        )}

        {/* Landing: no meeting selected → show input + history access */}
        {!meetingId && (
          <>
            <MeetingInput onSubmit={handleSubmit} submitting={submitting} />
            {submitError && (
              <div className="error-banner" role="alert">
                <span>{submitError}</span>
              </div>
            )}
            {/* Quick history access from landing page */}
            <div className="landing-history">
              <HistoryView
                onSelectMeeting={handleSelectMeeting}
                activeMeetingId={null}
                onToast={handleToast}
              />
            </div>
          </>
        )}

        {/* Processing: meeting submitted but not ready */}
        {meetingId && !isReady && <ProcessingTimeline meeting={meeting} />}

        {/* Ready: show tab navigation + content */}
        {meetingId && isReady && (
          <>
            {analysisError ? (
              <div className="error-banner" role="alert">
                <span>{analysisError}</span>
              </div>
            ) : loadingResults || !summary || !transcript ? (
              <div className="empty-state">Loading results…</div>
            ) : (
              <>
                <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
                <div className="tab-content">{renderTabContent()}</div>
              </>
            )}
          </>
        )}
      </main>

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
