"""Vercel serverless function entry point for FastAPI backend."""

import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from server import app

handler = app
