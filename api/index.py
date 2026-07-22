from pathlib import Path
import sys

backend = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend))

from server import app
