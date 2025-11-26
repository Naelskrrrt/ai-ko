"""
Health Check Endpoints
"""
from flask import Blueprint, jsonify, current_app
from app import db
import redis
import os

bp = Blueprint('health', __name__)

@bp.route('/health', methods=['GET'])
def health():
    """Health check simple pour Docker et Kubernetes"""
    return jsonify({'status': 'healthy', 'service': 'ai-ko-backend'}), 200

@bp.route('/health/detailed', methods=['GET'])
def health_detailed():
    """
    Health check détaillé avec vérification des dépendances
    Vérifie: Database, Redis, et autres services critiques
    """
    checks = {
        'status': 'healthy',
        'service': 'ai-ko-backend',
        'database': 'unknown',
        'redis': 'unknown',
    }
    
    # Check database
    try:
        db.session.execute(db.text('SELECT 1'))
        db.session.commit()
        checks['database'] = 'healthy'
    except Exception as e:
        checks['database'] = f'unhealthy: {str(e)}'
        checks['status'] = 'unhealthy'
    
    # Check Redis
    try:
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
        r = redis.from_url(redis_url)
        r.ping()
        checks['redis'] = 'healthy'
    except Exception as e:
        checks['redis'] = f'unhealthy: {str(e)}'
        checks['status'] = 'unhealthy'
    
    status_code = 200 if checks['status'] == 'healthy' else 503
    return jsonify(checks), status_code

@bp.route('/health/ready', methods=['GET'])
def health_ready():
    """
    Readiness check pour Kubernetes
    Indique si l'application est prête à recevoir du trafic
    """
    try:
        # Vérifier si la DB est accessible
        db.session.execute(db.text('SELECT 1'))
        db.session.commit()
        return jsonify({'status': 'ready'}), 200
    except Exception as e:
        return jsonify({
            'status': 'not ready',
            'error': str(e)
        }), 503

@bp.route('/health/live', methods=['GET'])
def health_live():
    """
    Liveness check pour Kubernetes
    Indique si l'application est vivante (mais pas forcément prête)
    """
    return jsonify({'status': 'alive'}), 200



