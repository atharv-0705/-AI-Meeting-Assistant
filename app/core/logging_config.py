import logging
import sys


def configure_logging(level: int = logging.INFO) -> None:
    root = logging.getLogger("meeting_assistant")
    root.setLevel(level)

    if root.handlers:
        return  # avoid duplicate handlers on --reload

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter("%(asctime)s | %(levelname)-8s | %(name)s | %(message)s", "%Y-%m-%d %H:%M:%S")
    )
    root.addHandler(handler)

    # Quiet down noisy third-party loggers; never log request/response bodies
    # that could contain transcript content or API responses with keys.
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("chromadb").setLevel(logging.WARNING)
