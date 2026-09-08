import logging

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from langchain_openai import ChatOpenAI

from app.core.config import get_settings
from app.core.exceptions import MissingApiKeyError, RagRetrievalError
from app.services.rag.vector_store import get_retriever, load_vector_store

logger = logging.getLogger("meeting_assistant.rag")

_SYSTEM_PROMPT = """You are an expert meeting assistant. Answer the user's question
based ONLY on the meeting transcript context provided below.

If the answer is not found in the context, say:
"I could not find this information in the meeting transcript."

Always be concise and precise. If quoting someone, mention it clearly.

Context from meeting transcript:
{context}"""


def _format_docs(docs) -> str:
    return "\n\n".join(doc.page_content for doc in docs)


def _get_llm() -> ChatOpenAI:
    settings = get_settings()
    api_key = settings.explabs_api_key or settings.openai_api_key
    if not api_key:
        raise MissingApiKeyError("OPENAI_API_KEY / EXPLABS_API_KEY is not configured on the server.")
    headers = {}
    if settings.openai_base_url and "openrouter.ai" in settings.openai_base_url:
        headers = {
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "Nexora AI Assistant",
        }
    return ChatOpenAI(
        model=settings.openai_model,
        api_key=api_key,
        base_url=settings.openai_base_url,
        temperature=0.3,
        default_headers=headers or None,
    )


def build_chat_chain(meeting_id: str):
    """Loads the persisted vector store for this meeting and builds a fresh RAG chain.
    Stateless by design - the chain is rebuilt per request rather than kept in memory,
    so it survives server restarts and doesn't leak memory across many meetings."""
    vector_store = load_vector_store(meeting_id)
    retriever = get_retriever(vector_store)
    llm = _get_llm()
    prompt = ChatPromptTemplate.from_messages([("system", _SYSTEM_PROMPT), ("human", "{question}")])

    return (
        {"context": retriever | RunnableLambda(_format_docs), "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )


def ask_question(meeting_id: str, question: str) -> str:
    try:
        chain = build_chat_chain(meeting_id)
        answer = chain.invoke(question)
        # Filter out safety guardrail artifacts if returned by certain models
        if "User Safety:" in answer:
            cleaned = "\n".join(
                line for line in answer.splitlines() if not line.strip().startswith("User Safety:")
            ).strip()
            if cleaned:
                answer = cleaned
        return answer
    except MissingApiKeyError:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.exception("RAG chat failed for meeting_id=%s", meeting_id)
        raise RagRetrievalError("Failed to generate an answer from the meeting transcript.") from exc
