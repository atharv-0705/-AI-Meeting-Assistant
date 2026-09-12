import { useCallback, useEffect, useState, useMemo } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import HistoryGrid from "./components/HistoryCard";
import DeveloperFooter from "./components/DeveloperFooter";
import ProcessingTimeline from "./components/ProcessingTimeline";
import MeetingDashboard from "./components/MeetingDashboard";
import ChatPanel from "./components/ChatPanel";
import TabNav from "./components/TabNav";
import TranscriptView from "./components/TranscriptView";
import ConfirmModal from "./components/ConfirmModal";
import Toast from "./components/Toast";
import { useMeetingPolling } from "./hooks/useMeetingPolling";
import { api, STAGE_ORDER } from "./services/api";

export default function App() {
  const [backendOnline, setBackendOnline] = useState(null);
  const [pipelineStatus, setPipelineStatus] = useState("idle"); // 'idle' | 'processing'
  const [meetingId, setMeetingId] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [toast, setToast] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { meeting } = useMeetingPolling(meetingId);
  const [loadingResults, setLoadingResults] = useState(false);

  // Check backend health on mount
  useEffect(() => {
    api
      .health()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  // Fetch past meetings list
  const fetchMeetings = useCallback(async () => {
    try {
      const data = await api.listMeetings();
      // Handle both array or { meetings: [...] }
      const list = Array.isArray(data) ? data : data?.meetings || [];
      // Map to normalized shape expected by HistoryGrid
      const normalized = list.map((m) => ({
        id: m.meeting_id || m.id,
        meeting_id: m.meeting_id || m.id,
        title: m.title || `Session ${(m.meeting_id || m.id).slice(0, 8)}`,
        date: m.created_at || m.date,
        status: m.status === "ready" ? "completed" : m.status === "failed" ? "failed" : "processing",
        rawStatus: m.status,
        source_type: m.source_type,
        duration: m.duration,
      }));
      setMeetings(normalized);
    } catch {
      // Keep empty if backend not reachable yet
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  // Compute activeStage & percent for PipelineWaveform / Hero
  const { activeStage, percent } = useMemo(() => {
    if (!meeting || pipelineStatus === "idle") {
      return { activeStage: 0, percent: 0 };
    }
    const status = meeting.status;
    if (status === "ready") return { activeStage: 3, percent: 100 };
    if (status === "failed") return { activeStage: 0, percent: 0 };

    const stageMap = {
      pending: { stage: 0, pct: 15 },
      downloading: { stage: 0, pct: 30 },
      chunking: { stage: 1, pct: 45 },
      transcribing: { stage: 1, pct: 65 },
      analyzing: { stage: 2, pct: 85 },
      indexing: { stage: 3, pct: 95 },
    };

    const info = stageMap[status] || { stage: 0, pct: 20 };
    return { activeStage: info.stage, percent: info.pct };
  }, [meeting, pipelineStatus]);

  // When polling reaches "ready", fetch summary & transcript
  useEffect(() => {
    if (meeting?.status !== "ready") return undefined;
    let cancelled = false;
    setLoadingResults(true);
    setAnalysisError(null);
    setPipelineStatus("idle");

    Promise.all([api.getSummary(meetingId), api.getTranscript(meetingId)])
      .then(([summaryData, transcriptData]) => {
        if (cancelled) return;
        setSummary(summaryData);
        setTranscript(transcriptData);
        fetchMeetings(); // Refresh history with newly ready meeting
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
  }, [meeting?.status, meetingId, fetchMeetings]);

  // When meeting fails during processing
  useEffect(() => {
    if (meeting?.status === "failed") {
      setPipelineStatus("idle");
      const errDetail = meeting?.error?.message || meeting?.error_message || "Processing failed.";
      setSubmitError(errDetail);
    }
  }, [meeting?.status, meeting?.error, meeting?.error_message]);

  // Handle starting a new processing session from Hero
  const handleStartProcessing = useCallback(async ({ mode, url, file, language }) => {
    setPipelineStatus("processing");
    setSubmitError(null);
    setSummary(null);
    setTranscript(null);

    try {
      const data =
        mode === "youtube"
          ? await api.createMeetingFromUrl(url, language)
          : await api.createMeetingFromFile(file, language);

      setMeetingId(data.meeting_id);
      setActiveTab("summary");
      fetchMeetings();
    } catch (err) {
      setPipelineStatus("idle");
      setSubmitError(err.message || "Failed to start processing.");
    }
  }, [fetchMeetings]);

  // Reset to new meeting / capture view
  const handleNewMeeting = () => {
    setMeetingId(null);
    setSummary(null);
    setTranscript(null);
    setSubmitError(null);
    setAnalysisError(null);
    setPipelineStatus("idle");
    setActiveTab("summary");
  };

  // Open an existing meeting from History
  const handleOpenMeeting = useCallback(async (selectedId) => {
    setMeetingId(selectedId);
    setPipelineStatus("idle");
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

  // Delete meeting confirmation & execution
  const handleDeleteRequest = (id) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await api.deleteMeeting(deleteTargetId);
      if (meetingId === deleteTargetId) {
        handleNewMeeting();
      }
      setToast({ type: "success", message: "Meeting deleted successfully." });
      await fetchMeetings();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to delete meeting." });
    } finally {
      setDeleting(false);
      setDeleteTargetId(null);
    }
  };

  const handleToast = useCallback((t) => {
    setToast(t);
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const isReady = meeting?.status === "ready" || (Boolean(summary) && Boolean(transcript));
  const isProcessingLive = pipelineStatus === "processing" || (Boolean(meetingId) && !isReady);

  const renderTabContent = () => {
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
          <HistoryGrid
            meetings={meetings}
            onOpen={handleOpenMeeting}
            onDelete={handleDeleteRequest}
            onNew={handleNewMeeting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300" style={{ background: 'var(--bg-gradient)', color: 'var(--text-primary)' }}>
      {/* Top Header */}
      <Header
        backendOnline={backendOnline}
        onNewMeeting={handleNewMeeting}
        hasActiveMeeting={Boolean(meetingId && isReady)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8">
        {/* Backend Offline Alert Banner */}
        {backendOnline === false && (
          <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span>
                <strong>Backend unavailable.</strong> Ensure the FastAPI server is running with{" "}
                <code className="font-mono bg-black/5 dark:bg-black/30 px-1.5 py-0.5 rounded text-xs border border-red-500/20">
                  uvicorn main:app --port 2210 --reload
                </code>
              </span>
            </div>
            <button
              onClick={() => {
                api.health().then(() => setBackendOnline(true)).catch(() => setBackendOnline(false));
              }}
              className="text-xs font-mono underline hover:text-red-700 dark:hover:text-red-300 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Global Submit/API Error Banner */}
        {submitError && (
          <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{submitError}</span>
            </div>
            <button
              onClick={() => setSubmitError(null)}
              className="text-xs hover:text-red-200 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* View 1: Landing Page (No meeting active) */}
        {!meetingId && (
          <div>
            <Hero
              onStartProcessing={handleStartProcessing}
              status={pipelineStatus}
              activeStage={activeStage}
              percent={percent}
            />

            <HistoryGrid
              meetings={meetings}
              onOpen={handleOpenMeeting}
              onDelete={handleDeleteRequest}
              onNew={handleNewMeeting}
            />
          </div>
        )}

        {/* View 2: Processing Live Session */}
        {meetingId && isProcessingLive && (
          <div className="py-8">
            <Hero
              onStartProcessing={handleStartProcessing}
              status="processing"
              activeStage={activeStage}
              percent={percent}
            />

            <div className="mt-8">
              <ProcessingTimeline meeting={meeting} />
            </div>
          </div>
        )}

        {/* View 3: Completed Meeting Dashboard */}
        {meetingId && isReady && (
          <div className="py-4">
            {analysisError ? (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {analysisError}
              </div>
            ) : loadingResults || !summary || !transcript ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-signal-ai border-t-transparent animate-spin" />
                <p className="text-text-muted text-sm font-mono">
                  Loading meeting summary &amp; transcripts…
                </p>
              </div>
            ) : (
              <div>
                <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
                <div className="mt-6">{renderTabContent()}</div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Developer Footer */}
      <DeveloperFooter
        avatarUrl="/Dev_Img.jpeg"
        name="Atharv Gupta"
        branch="IT (AI & Robotics), 2024-2028"
        email="mailto:atharvgupta0705@gmail.com"
        github="https://github.com/atharv-0705"
        linkedin="https://www.linkedin.com/in/atharv-gupta-45a37b36a/"
      />

      {/* Modals & Toasts */}
      {deleteTargetId && (
        <ConfirmModal
          title="Delete Meeting Session"
          message="Are you sure you want to delete this meeting? This will permanently remove its transcript, summary, audio files, and ChromaDB vector index."
          confirmLabel="Delete Meeting"
          danger={true}
          disabled={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
