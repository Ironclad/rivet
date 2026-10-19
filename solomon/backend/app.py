"""
backend/app.py - Backend entry point with full Flask application
هذا هو الـ Backend الجاهز للنشر على Render.com
"""
import os
import sys

# Add parent directory to path so we can import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.config import Config

# Create Flask app
app = create_app(Config)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "0.0.0.0")
    debug = os.getenv("FLASK_ENV") == "development"

    print(f"""
╔══════════════════════════════════════════════╗
║        Solomon v4.0 — Backend API           ║
╠══════════════════════════════════════════════╣
║  Host:    {host:<35}║
║  Port:    {port:<35}║
║  Debug:   {str(debug):<35}║
║  Health:  http://{host}:{port}/api/health{' ' * max(0, 19 - len(f'http://{host}:{port}/api/health'))}║
╚══════════════════════════════════════════════╝
    """)

    app.run(host=host, port=port, debug=debug)
