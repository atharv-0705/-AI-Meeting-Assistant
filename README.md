# NEXORA — AI Video & Meeting Intelligence Engine (RAG)

> **From Spoken Words to Living Intelligence**  
> Ingest meeting recordings and YouTube videos. Get instant high-fidelity transcription, structured summaries, key action items, and ask deep questions using Retrieval-Augmented Generation (RAG).

---

## Live Link
https://ai-meeting-assistant-chi-ecru.vercel.app/

---

## 🌟 Overview

**NEXORA** is a full-stack, AI-powered meeting and video intelligence platform. It processes long meeting recordings and YouTube video streams, transcribes speech across languages, extracts structured executive summaries and action items using LLMs, indexes transcripts into a vector database (ChromaDB), and enables interactive RAG-based conversations.

---

## ✨ Features & Capabilities

- 🎥 **Multi-Source Audio & Video Ingestion**:
  - Direct YouTube video URL ingestion with automated `yt-dlp` cookie handling.
  - Local media file uploads (MP3, WAV, MP4, M4A, WEBM).
- 🎙️ **Multi-Language Speech-to-Text**:
  - Local **OpenAI Whisper** engine for high-accuracy English transcription.
  - **Sarvam AI** integration for Hinglish / Hindi speech recognition.
- ⚡ **Real-Time Processing Pipeline**:
  - Visual status timeline tracking 7 discrete processing stages:  
    `Queued` → `Acquiring audio` → `Splitting audio` → `Transcribing` → `Analyzing meeting` → `Indexing for chat` → `Ready`.
- 🧠 **Structured LLM Meeting Analysis**:
  - Executive Summaries
  - Action Items & Owner Assignments
  - Key Decisions Made
  - Essential Questions Raised
- 💬 **Vector-Retrieved RAG Chat**:
  - Semantic vector indexing powered by **ChromaDB** & **LangChain**.
  - Natural language conversational Q&A over full meeting transcripts with precise source context.
- 📄 **Multi-Format Exporting**:
  - Export full meeting intelligence, transcripts, or summaries directly into formatted `.txt` or `.pdf` files.
- 🎨 **Modern Glassmorphic UI**:
  - Responsive dark design system built with React 19, Tailwind CSS, and custom glassmorphic styling.
  - Automatic backend health & dual-port auto-discovery (Ports `2210` & `8000`).

---

## 🛠️ Technology Stack

### **Backend & AI Engine**
- **Framework**: FastAPI (Python 3.12+), Uvicorn, Pydantic v2
- **Audio Processing**: `yt-dlp`, `pydub`, `ffmpeg`
- **Speech Recognition**: `openai-whisper` (Local AI), Sarvam AI API
- **RAG & Vector Storage**: LangChain (`langchain-openai`, `langchain-chroma`), ChromaDB, HuggingFace Embeddings
- **LLM Provider**: OpenAI API (`gpt-4o` / `gpt-3.5-turbo`)
- **Document Export**: `fpdf2`, `aiofiles`

### **Frontend Interface**
- **Framework**: React 19, Vite
- **Styling**: Tailwind CSS 3, Custom CSS Tokens, Glassmorphism, Micro-animations
- **State & API Handling**: Native Hooks & Service Abstraction with automatic dual-port fallback (2210 ↔ 8000)

---

## 📂 Project Architecture

```
AI Video Assistant With RAG/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── routes/
│   │       │   ├── chat.py         # RAG Chat endpoint
│   │       │   ├── export.py       # TXT & PDF report streaming
│   │       │   ├── health.py       # System health check
│   │       │   ├── meetings.py     # Meeting creation & management
│   │       │   ├── summary.py      # Summary & analysis retrieval
│   │       │   └── transcript.py   # Transcript retrieval
│   │       └── router.py
│   ├── core/
│   │   ├── config.py               # Pydantic settings & env loading
│   │   ├── exceptions.py           # Centralized exception handlers
│   │   └── logging_config.py
│   ├── models/
│   │   └── meeting_store.py        # In-memory lifecycle & state store
│   └── services/
│       ├── audio/                  # Downloader & audio chunker
│       ├── meeting_analysis/       # Summarizer & Action Item extractor
│       ├── rag/                    # Vector indexing & LangChain QA engine
│       ├── transcription/          # Whisper & Sarvam AI engines
│       └── export/                 # PDF & TXT generator
├── frontend/
│   ├── public/
│   │   └── Dev_Img.jpeg            # Developer profile asset
│   ├── src/
│   │   ├── components/             # React UI components (Dashboard, Header, DeveloperFooter, etc.)
│   │   ├── services/
│   │   │   └── api.js              # API service client & dual-port fallback logic
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── main.py                         # FastAPI application entrypoint
├── requirements.txt                # Python dependencies
└── README.md
```

---

## 🚀 Getting Started & Installation

### **Prerequisites**
- **Python**: Version 3.12+
- **Node.js**: Version 18+ & `npm`
- **FFmpeg**: Installed and added to System PATH (required for audio chunking)

---

### **1. Backend Setup**

1. **Clone the repository**:
   ```bash
   git clone https://github.com/atharv-0705/-AI-Meeting-Assistant.git
   cd -AI-Meeting-Assistant
   ```

2. **Create and activate a virtual environment**:
   ```powershell
   # Windows PowerShell
   python -m venv .venv
   .\.venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and enter your API keys:
   ```powershell
   copy .env.example .env
   ```
   *Required Keys in `.env`:*
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   SARVAM_API_KEY=your_sarvam_api_key_here
   ```

5. **Start the FastAPI server**:
   ```powershell
   uvicorn main:app --port 2210 --reload
   ```
   - **API Docs**: [http://127.0.0.1:2210/docs](http://127.0.0.1:2210/docs)
   - **API Base**: [http://127.0.0.1:2210/api/v1](http://127.0.0.1:2210/api/v1)

---

### **2. Frontend Setup**

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node packages**:
   ```bash
   npm install
   ```

3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   - **Web App**: Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | System status & health check |
| `POST` | `/api/v1/meetings` | Submit YouTube URL or file upload to begin processing pipeline |
| `GET` | `/api/v1/meetings` | List all meeting sessions |
| `GET` | `/api/v1/meetings/{id}` | Get processing stage status & metadata for a meeting |
| `DELETE` | `/api/v1/meetings/{id}` | Delete meeting session and remove vector index |
| `GET` | `/api/v1/meetings/{id}/transcript` | Retrieve full timestamped transcript |
| `GET` | `/api/v1/meetings/{id}/summary` | Retrieve summary, action items, decisions, and questions |
| `POST` | `/api/v1/meetings/{id}/chat` | Ask natural language questions via vector RAG engine |
| `GET` | `/api/v1/meetings/{id}/export` | Download exported report (`format=pdf` or `format=txt`) |

---

## 👨‍💻 Developer Info

Developed by **Atharv Gupta**  
*IT (AI & Robotics), 2024–2028*  

- **GitHub**: [@atharv-0705](https://github.com/atharv-0705)
- **LinkedIn**: [Atharv Gupta](https://linkedin.com/in/atharv-gupta)
- **Email**: [atharvgupta0705@gmail.com](mailto:atharvgupta0705@gmail.com)

---

## 📜 License

This project is open-source under the MIT License.

