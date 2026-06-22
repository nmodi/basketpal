"""Loads .env into os.environ. Import this FIRST, before any src.* module that
reads environment variables at import time (e.g. openrouter_content_generator's
module-level reads of CONTENT_DEBUG_IO / CONTENT_IO_DIR). Importing is
idempotent — load_dotenv() does not overwrite values already in os.environ.
"""
from dotenv import load_dotenv

load_dotenv()
