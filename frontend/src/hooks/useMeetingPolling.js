import { useEffect, useRef, useState } from "react";
import { api, TERMINAL_STATUSES } from "../services/api";

/** Polls GET /meetings/{id} every `intervalMs` until status is ready/failed. */
export function useMeetingPolling(meetingId, intervalMs = 3000) {
  const [meeting, setMeeting] = useState(null);
  const timerRef = useRef(null);
  const pollRef = useRef(null);

  pollRef.current = async () => {
    if (!meetingId) return;
    try {
      const data = await api.getMeeting(meetingId);
      setMeeting(data);
      if (!TERMINAL_STATUSES.has(data.status)) {
        timerRef.current = setTimeout(() => pollRef.current(), intervalMs);
      }
    } catch {
      timerRef.current = setTimeout(() => pollRef.current(), intervalMs);
    }
  };

  useEffect(() => {
    if (!meetingId) {
      setMeeting(null);
      return undefined;
    }
    pollRef.current();
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId, intervalMs]);

  return { meeting };
}
