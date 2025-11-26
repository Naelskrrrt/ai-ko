"""
Configuration Celery
"""
from celery import Celery
import os
import logging

logger = logging.getLogger(__name__)


def build_redis_url(host=None, port=None, db=0, password=None, username=None):
    """
    Construit une URL Redis avec support de l'authentification
    
    Args:
        host: Hôte Redis (défaut: localhost)
        port: Port Redis (défaut: 6379)
        db: Numéro de base de données (défaut: 0)
        password: Mot de passe Redis (optionnel)
        username: Nom d'utilisateur Redis (optionnel)
    
    Returns:
        URL Redis formatée
    """
    host = host or os.getenv('REDIS_HOST', 'localhost')
    port = port or int(os.getenv('REDIS_PORT', '6379'))
    db = db or int(os.getenv('REDIS_DB', '0'))
    
    # Si un mot de passe est fourni, l'inclure dans l'URL
    if password or os.getenv('REDIS_PASSWORD'):
        password = password or os.getenv('REDIS_PASSWORD')
        username = username or os.getenv('REDIS_USERNAME', '')
        
        if username:
            return f'redis://{username}:{password}@{host}:{port}/{db}'
        else:
            return f'redis://:{password}@{host}:{port}/{db}'
    else:
        return f'redis://{host}:{port}/{db}'


def make_celery():
    """Créer instance Celery"""
    # Récupérer les URLs depuis les variables d'environnement ou construire avec authentification
    broker_url = os.getenv('CELERY_BROKER_URL')
    result_backend = os.getenv('CELERY_RESULT_BACKEND')
    
    # Si les URLs complètes ne sont pas fournies, les construire
    if not broker_url:
        broker_db = int(os.getenv('REDIS_BROKER_DB', '0'))
        broker_url = build_redis_url(db=broker_db)
    
    if not result_backend:
        result_db = int(os.getenv('REDIS_RESULT_DB', '1'))
        result_backend = build_redis_url(db=result_db)
    
    logger.info(f"Configuration Celery - Broker: {broker_url.split('@')[-1] if '@' in broker_url else broker_url}")
    logger.info(f"Configuration Celery - Backend: {result_backend.split('@')[-1] if '@' in result_backend else result_backend}")
    
    celery = Celery(
        'ai-ko',
        broker=broker_url,
        backend=result_backend,
        include=[
            'app.tasks.quiz_generation',
            'app.tasks.correction',
            'app.tasks.reports'
        ]
    )
    
    celery.conf.update(
        task_serializer='json',
        accept_content=['json'],
        result_serializer='json',
        timezone='UTC',
        enable_utc=True,
        task_track_started=True,
        task_time_limit=600,  # 10 minutes
        task_soft_time_limit=540,  # 9 minutes
        worker_prefetch_multiplier=1,
        worker_max_tasks_per_child=50,
    )
    
    return celery

celery = make_celery()



