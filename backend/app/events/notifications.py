"""
Événements WebSocket pour les notifications
"""
from app.extensions import socketio
from flask_socketio import emit, join_room, leave_room
from flask_jwt_extended import decode_token
from flask import request
import logging

logger = logging.getLogger(__name__)

# Rooms pour les utilisateurs connectés
ADMIN_ROOM = 'admins'
USER_ROOMS = {}  # user_id -> sid


@socketio.on('connect')
def handle_connect():
    """Gère la connexion d'un client WebSocket"""
    logger.info(f"Client connecté: {request.sid}")
    emit('connected', {'status': 'success'})


@socketio.on('disconnect')
def handle_disconnect():
    """Gère la déconnexion d'un client WebSocket"""
    logger.info(f"Client déconnecté: {request.sid}")

    # Nettoyer les rooms utilisateur
    for user_id, sid in list(USER_ROOMS.items()):
        if sid == request.sid:
            leave_room(f"user_{user_id}", sid=request.sid)
            del USER_ROOMS[user_id]
            logger.info(f"Utilisateur {user_id} retiré de sa room")


@socketio.on('join_admin_room')
def handle_join_admin_room(data):
    """Admin rejoint la room des administrateurs"""
    try:
        # Vérifier le token JWT
        token = data.get('token')
        if not token:
            emit('error', {'message': 'Token manquant'})
            return

        # Décoder le token pour vérifier le rôle
        try:
            decoded = decode_token(token)
            user_id = decoded.get('sub')
            role = decoded.get('role')
        except Exception as e:
            logger.error(f"Erreur décodage token: {e}")
            emit('error', {'message': 'Token invalide'})
            return

        if role != 'admin':
            emit('error', {'message': 'Accès non autorisé'})
            return

        # Rejoindre la room admin
        join_room(ADMIN_ROOM, sid=request.sid)
        logger.info(f"Admin {user_id} rejoint la room {ADMIN_ROOM}")

        emit('joined_admin_room', {
            'status': 'success',
            'room': ADMIN_ROOM
        })

    except Exception as e:
        logger.error(f"Erreur join_admin_room: {e}")
        emit('error', {'message': 'Erreur lors de la connexion admin'})


@socketio.on('join_user_room')
def handle_join_user_room(data):
    """Utilisateur rejoint sa room personnelle"""
    try:
        # Vérifier le token JWT
        token = data.get('token')
        if not token:
            emit('error', {'message': 'Token manquant'})
            return

        # Décoder le token pour récupérer l'ID utilisateur
        try:
            decoded = decode_token(token)
            user_id = decoded.get('sub')
        except Exception as e:
            logger.error(f"Erreur décodage token: {e}")
            emit('error', {'message': 'Token invalide'})
            return

        # Rejoindre la room utilisateur
        room_name = f"user_{user_id}"
        join_room(room_name, sid=request.sid)
        USER_ROOMS[user_id] = request.sid

        logger.info(f"Utilisateur {user_id} rejoint sa room {room_name}")

        emit('joined_user_room', {
            'status': 'success',
            'room': room_name,
            'user_id': user_id
        })

    except Exception as e:
        logger.error(f"Erreur join_user_room: {e}")
        emit('error', {'message': 'Erreur lors de la connexion utilisateur'})


def notify_admin_pending_user(user_id, user_data):
    """
    Notifie tous les admins d'un nouvel utilisateur en attente de validation

    Args:
        user_id (str): ID de l'utilisateur
        user_data (dict): Données de l'utilisateur
    """
    try:
        notification = {
            'type': 'pending_user',
            'user_id': user_id,
            'user_data': user_data,
            'message': f'Nouvel utilisateur en attente: {user_data.get("name", "N/A")} ({user_data.get("email", "N/A")})',
            'timestamp': None  # Sera ajouté côté client
        }

        logger.info(f"Notification admin: nouvel utilisateur {user_id}")
        socketio.emit('pending_user', notification, room=ADMIN_ROOM)

    except Exception as e:
        logger.error(f"Erreur notification admin pending user: {e}")


def notify_user_activated(user_id):
    """
    Notifie un utilisateur que son compte a été activé

    Args:
        user_id (str): ID de l'utilisateur
    """
    try:
        notification = {
            'type': 'account_activated',
            'message': 'Votre compte a été validé par un administrateur. Vous pouvez maintenant vous connecter.',
            'timestamp': None  # Sera ajouté côté client
        }

        room_name = f"user_{user_id}"
        logger.info(f"Notification utilisateur {user_id}: compte activé")
        socketio.emit('account_activated', notification, room=room_name)

    except Exception as e:
        logger.error(f"Erreur notification user activated: {e}")


def notify_user_rejected(user_id, reason="Votre compte a été rejeté par un administrateur"):
    """
    Notifie un utilisateur que son compte a été rejeté

    Args:
        user_id (str): ID de l'utilisateur
        reason (str): Raison du rejet
    """
    try:
        notification = {
            'type': 'account_rejected',
            'message': reason,
            'timestamp': None  # Sera ajouté côté client
        }

        room_name = f"user_{user_id}"
        logger.info(f"Notification utilisateur {user_id}: compte rejeté")
        socketio.emit('account_rejected', notification, room=room_name)

    except Exception as e:
        logger.error(f"Erreur notification user rejected: {e}")


def notify_admins_stats_update():
    """
    Notifie tous les admins d'une mise à jour des statistiques
    """
    try:
        logger.info("Notification admin: mise à jour statistiques")
        socketio.emit('stats_update', {'timestamp': None}, room=ADMIN_ROOM)

    except Exception as e:
        logger.error(f"Erreur notification stats update: {e}")
