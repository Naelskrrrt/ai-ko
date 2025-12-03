"""
Extensions Flask pour l'application
"""
from flask_socketio import SocketIO

# Configuration SocketIO avec CORS
socketio = SocketIO(cors_allowed_origins="*")
