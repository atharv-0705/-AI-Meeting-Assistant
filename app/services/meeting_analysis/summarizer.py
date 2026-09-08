import logging

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from langchain_openai import ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import get_settings
from app.core.exceptions import MissingApiKeyError, OpenAIApiError

logger = logging.getLogger("meeting_assistant.analysis")


def get_llm(temperature: float = 0.3) -> ChatOpenAI:
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
        temperature=temperature,
        default_headers=headers or None,
    )


def split_transcript(transcript: str) -> list[str]:
    splitter = RecursiveCharacterTextSplitter(chunk_size=3000, chunk_overlap=200)
    return splitter.split_text(transcript)


def summarize(transcript: str) -> str:
    try:
        llm = get_llm(temperature=0.3)

        map_prompt = ChatPromptTemplate.from_messages(
            [
                ("system", "You are a helpful assistant that summarizes transcripts."),
                ("human", "Summarize the following transcript in a concise manner:\n{text}"),
            ]
        )
        map_chain = map_prompt | llm | StrOutputParser()

        chunks = split_transcript(transcript)
        chunk_summaries = [map_chain.invoke({"text": chunk}) for chunk in chunks]
        combined = "\n\n".join(chunk_summaries)

        combined_prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are an expert meeting summarizer. Combine these partial summaries "
                    "into one final professional meeting summary in bullet points. "
                    "Match the natural language of the transcript (if it is Hinglish or Hindi, write in natural Hinglish/Hindi; if English, write in English).",
                ),
                ("human", "{text}"),
            ]
        )
        combined_chain = (
            RunnablePassthrough() | RunnableLambda(lambda x: {"text": x}) | combined_prompt | llm | StrOutputParser()
        )
        return combined_chain.invoke(combined)
    except MissingApiKeyError:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.exception("Summarization failed")
        raise OpenAIApiError(f"Failed to generate meeting summary: {exc}") from exc


def generate_title(transcript: str) -> str:
    try:
        llm = get_llm(temperature=0.3)
        title_chain = (
            RunnablePassthrough()
            | RunnableLambda(lambda x: {"text": x})
            | ChatPromptTemplate.from_messages(
                [
                    (
                        "system",
                        "Based on the meeting transcript, generate a short professional title "
                        "(max 8 words). Match the language of the transcript (Hinglish/Hindi or English). "
                        "Only return the title, nothing else.",
                    ),
                    ("human", "{text}"),
                ]
            )
            | llm
            | StrOutputParser()
        )
        return title_chain.invoke(transcript[:2000]).strip()
    except MissingApiKeyError:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.exception("Title generation failed")
        raise OpenAIApiError(f"Failed to generate meeting title: {exc}") from exc
