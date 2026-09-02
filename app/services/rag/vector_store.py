import logging
import os

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import get_settings
from app.core.exceptions import VectorStoreError

logger = logging.getLogger("meeting_assistant.rag")

_embeddings = None  # loaded once, reused across all meetings


def get_embeddings() -> 'Any':
    global _embeddings
    if _embeddings is None:
        from langchain_huggingface import HuggingFaceEmbeddings
        settings = get_settings()
        _embeddings = HuggingFaceEmbeddings(model_name=settings.embedding_model, model_kwargs={"device": "cpu"})
    return _embeddings


def _collection_name(meeting_id: str) -> str:
    return f"meeting_{meeting_id}"


def _persist_dir(meeting_id: str) -> str:
    settings = get_settings()
    path = os.path.join(settings.vector_db_dir, meeting_id)
    os.makedirs(path, exist_ok=True)
    return path


def build_vector_store(meeting_id: str, transcript: str) -> 'Any':
    """Chunk the transcript, embed it, and persist a Chroma collection scoped to this meeting."""
    from langchain_chroma import Chroma
    try:
        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = splitter.split_text(transcript)
        docs = [Document(page_content=chunk, metadata={"chunk_index": i}) for i, chunk in enumerate(chunks)]

        vector_store = Chroma.from_documents(
            documents=docs,
            embedding=get_embeddings(),  # NOTE: 'embedding', not 'embedding_function' -
            collection_name=_collection_name(meeting_id),  # from_documents already forwards
            persist_directory=_persist_dir(meeting_id),  # embedding_function internally.
        )
        logger.info("Vector store built for meeting_id=%s (%d chunks)", meeting_id, len(chunks))
        return vector_store
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to build vector store for meeting_id=%s", meeting_id)
        raise VectorStoreError("Failed to index the meeting transcript for chat.") from exc


def load_vector_store(meeting_id: str) -> 'Any':
    from langchain_chroma import Chroma
    try:
        return Chroma(
            collection_name=_collection_name(meeting_id),
            embedding_function=get_embeddings(),  # constructor path DOES use embedding_function
            persist_directory=_persist_dir(meeting_id),
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to load vector store for meeting_id=%s", meeting_id)
        raise VectorStoreError("Failed to load the meeting's indexed transcript.") from exc


def get_retriever(vector_store: 'Any', k: int | None = None):
    settings = get_settings()
    return vector_store.as_retriever(search_type="similarity", search_kwargs={"k": k or settings.rag_top_k})
