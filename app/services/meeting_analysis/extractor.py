import logging

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from langchain_openai import ChatOpenAI

from app.core.config import get_settings
from app.core.exceptions import MissingApiKeyError, OpenAIApiError

logger = logging.getLogger("meeting_assistant.analysis")


def get_llm() -> ChatOpenAI:
    settings = get_settings()
    api_key = settings.explabs_api_key or settings.openai_api_key
    if not api_key:
        raise MissingApiKeyError("OPENAI_API_KEY / EXPLABS_API_KEY is not configured on the server.")
    return ChatOpenAI(
        model=settings.openai_model,
        api_key=api_key,
        base_url=settings.openai_base_url,
        temperature=0.2,
    )


def _build_chain(system_prompt: str):
    llm = get_llm()
    return (
        RunnablePassthrough()
        | RunnableLambda(lambda x: {"text": x})
        | ChatPromptTemplate.from_messages([("system", system_prompt), ("human", "{text}")])
        | llm
        | StrOutputParser()
    )


def _run(system_prompt: str, transcript: str, label: str) -> str:
    try:
        return _build_chain(system_prompt).invoke(transcript)
    except MissingApiKeyError:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.exception("%s extraction failed", label)
        raise OpenAIApiError(f"Failed to extract {label} from the transcript.") from exc


def extract_action_items(transcript: str) -> str:
    return _run(
        "You are an expert meeting analyst. From the meeting transcript, "
        "extract all action items. For each provide:\n"
        "- Task description\n- Owner (who is responsible)\n"
        "- Deadline (if mentioned, else write 'Not specified')\n\n"
        "Format as a numbered list. If none found say 'No action items found.'",
        transcript,
        "action items",
    )


def extract_key_decisions(transcript: str) -> str:
    return _run(
        "You are an expert meeting analyst. From the meeting transcript, "
        "extract all key decisions made. Format as a numbered list. "
        "If none found say 'No key decisions found.'",
        transcript,
        "key decisions",
    )


def extract_questions(transcript: str) -> str:
    return _run(
        "From the meeting transcript, extract all unresolved questions "
        "or topics needing follow-up. Format as a numbered list. "
        "If none found say 'No open questions found.'",
        transcript,
        "open questions",
    )
