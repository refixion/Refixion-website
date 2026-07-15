"""WSGI entry point for Vercel deployment."""
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent))

from server import app

# For Vercel
handler = app
