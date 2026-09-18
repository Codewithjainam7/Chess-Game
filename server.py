"""
server.py
Main entrypoint for the Grandmaster Chess Python Backend & Static Server.
Runs on port 5173.
"""

import sys
import os

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.app import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5173))
    print(f"Starting Python Grandmaster Chess Backend on port {port}...")
    print(f"Web interface: http://localhost:{port}/")
    print(f"API endpoints: http://localhost:{port}/api/health")
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
