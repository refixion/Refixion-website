from pathlib import Path
import sys
import os

print("API INDEX LOADED")
print("CURRENT FILE:", __file__)
print("FILES:", os.listdir(Path(__file__).parent.parent))

backend = Path(__file__).resolve().parent.parent / "backend"

print("BACKEND EXISTS:", backend.exists())
print("BACKEND FILES:", list(backend.iterdir()) if backend.exists() else "NOT FOUND")

sys.path.insert(0, str(backend))

from server import app
