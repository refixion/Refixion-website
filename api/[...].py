"""Vercel serverless function entry point for FastAPI backend."""
import sys
import os
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

# Import the FastAPI app from backend/server.py
from server import app

# Export as handler for Vercel
handler = app
