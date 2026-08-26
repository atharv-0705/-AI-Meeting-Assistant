const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:2210/api/v1";

/**
 * Wraps fetch, unwraps the backend's { success, data, message } / { success, error } envelope,
 * and throws a normalized ApiError on any failure (network, validation, or server-side).
 */
class ApiError extends Error {
  constructor(message, code = "NETWORK_ERROR", status = 0) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, options);
  } catch {
    throw new ApiError(
      "Could not reach the Nexora backend. Is it running at " + BASE_URL + "?",
      "BACKEND_UNAVAILABLE",
      0
    );
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new ApiError("The server returned an unexpected response.", "INVALID_RESPONSE", response.status);
  }

  if (!response.ok || body.success === false) {
    const err = body?.error || {};
    throw new ApiError(err.message || "Something went wrong.", err.code || "UNKNOWN_ERROR", response.status);
  }

  return body.data;
}

export const api = {
  health: () => request("/health"),

  createMeetingFromUrl: (youtubeUrl, language) => {
    const form = new FormData();
    form.append("youtube_url", youtubeUrl);
    form.append("language", language);
    return request("/meetings", { method: "POST", body: form });
  },

  createMeetingFromFile: (file, language) => {
    const form = new FormData();
    form.append("file", file);
    form.append("language", language);
    return request("/meetings", { method: "POST", body: form });
  },

  listMeetings: () => request("/meetings"),

  getMeeting: (meetingId) => request(`/meetings/${meetingId}`),

  deleteMeeting: (meetingId) => request(`/meetings/${meetingId}`, { method: "DELETE" }),

  getTranscript: (meetingId) => request(`/meetings/${meetingId}/transcript`),

  getSummary: (meetingId) => request(`/meetings/${meetingId}/summary`),

  chat: (meetingId, question) =>
    request(`/meetings/${meetingId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    }),

  /** Export bypasses the JSON envelope - the backend streams a raw file.
   *  @param {"txt"|"pdf"} format
   *  @param {"full"|"summary"|"transcript"} type */
  exportMeeting: async (meetingId, format, type = "full") => {
    let response;
    try {
      response = await fetch(`${BASE_URL}/meetings/${meetingId}/export?format=${format}&type=${type}`);
    } catch {
      throw new ApiError("Could not reach the backend to export this meeting.", "BACKEND_UNAVAILABLE", 0);
    }
    if (!response.ok) {
      let message = "Failed to export the meeting report.";
      try {
        const body = await response.json();
        message = body?.error?.message || message;
      } catch {
        /* response wasn't JSON - keep default message */
      }
      throw new ApiError(message, "EXPORT_FAILED", response.status);
    }
    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : `meeting_report.${format}`;
    return { blob, filename };
  },
};

export { ApiError };

/** Terminal meeting statuses - polling stops once one of these is reached. */
export const TERMINAL_STATUSES = new Set(["ready", "failed"]);

export const STAGE_LABELS = {
  pending: "Queued",
  downloading: "Acquiring audio",
  chunking: "Splitting audio",
  transcribing: "Transcribing",
  analyzing: "Analyzing meeting",
  indexing: "Indexing for chat",
  ready: "Ready",
  failed: "Failed",
};

export const STAGE_ORDER = [
  "pending",
  "downloading",
  "chunking",
  "transcribing",
  "analyzing",
  "indexing",
  "ready",
];
