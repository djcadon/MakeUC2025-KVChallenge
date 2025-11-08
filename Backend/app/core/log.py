import logging
from pathlib import Path
import os

def init_log(log_file_name: str):
    """Initialize logging safely for both development and deployed (bundled) environments."""

    # Determine environment
    env = os.getenv("ENV", "dev").lower()

    # Create a named logger
    logger = logging.getLogger(log_file_name)
    

    # Choose log directory based on environment
    if env == "prod":
        log_dir = Path("/home/PIberDash/Logging")
        logger.setLevel(logging.WARNING)
    else:
        log_dir = Path(__file__).resolve().parent.parent.parent / "logs"
        logger.setLevel(logging.INFO)

    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / log_file_name

    # Avoid duplicate handlers if called multiple times
    if not logger.handlers:
        file_handler = logging.FileHandler(log_file, mode="a", encoding="utf-8")
        console_handler = logging.StreamHandler()

        fmt = logging.Formatter("%(asctime)s [%(levelname)s] [%(name)s] %(message)s")
        file_handler.setFormatter(fmt)
        console_handler.setFormatter(fmt)

        logger.addHandler(file_handler)
        logger.addHandler(console_handler)

    return logger