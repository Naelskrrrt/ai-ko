"""
Gestionnaire de tâches asynchrones en mémoire (sans Redis/Celery)
"""
import threading
import uuid
import time
import logging
from typing import Dict, Optional, Callable, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class AsyncTaskManager:
    """Gestionnaire de tâches asynchrones en mémoire"""
    
    def __init__(self):
        self.tasks: Dict[str, Dict[str, Any]] = {}
        self.lock = threading.Lock()
    
    def create_task(self, task_func: Callable, *args, **kwargs) -> str:
        """
        Crée et lance une tâche asynchrone
        
        Args:
            task_func: Fonction à exécuter
            *args: Arguments positionnels
            **kwargs: Arguments nommés
        
        Returns:
            ID de la tâche
        """
        task_id = str(uuid.uuid4())
        
        # Initialiser l'état de la tâche
        with self.lock:
            self.tasks[task_id] = {
                'status': 'PENDING',
                'result': None,
                'error': None,
                'progress': 0,
                'message': 'Tâche en attente...',
                'started_at': datetime.now(),
                'estimated_duration': None,
                'estimated_completion': None,
            }
        
        # Lancer la tâche dans un thread séparé
        thread = threading.Thread(
            target=self._execute_task,
            args=(task_id, task_func, args, kwargs),
            daemon=True
        )
        thread.start()
        
        return task_id
    
    def create_task_with_id(self, task_func: Callable) -> str:
        """
        Crée et lance une tâche asynchrone où la fonction reçoit le task_id en premier argument
        
        Args:
            task_func: Fonction à exécuter qui prend task_id comme premier paramètre
        
        Returns:
            ID de la tâche
        """
        task_id = str(uuid.uuid4())
        
        # Initialiser l'état de la tâche
        with self.lock:
            self.tasks[task_id] = {
                'status': 'PENDING',
                'result': None,
                'error': None,
                'progress': 0,
                'message': 'Tâche en attente...',
                'started_at': datetime.now(),
                'estimated_duration': None,
                'estimated_completion': None,
            }
        
        # Lancer la tâche dans un thread séparé avec task_id comme premier argument
        thread = threading.Thread(
            target=self._execute_task,
            args=(task_id, task_func, (task_id,), {}),
            daemon=True
        )
        thread.start()
        
        return task_id
    
    def _execute_task(self, task_id: str, task_func: Callable, args: tuple, kwargs: dict):
        """Exécute une tâche dans un thread séparé"""
        try:
            with self.lock:
                self.tasks[task_id]['status'] = 'PROGRESS'
                self.tasks[task_id]['message'] = 'Tâche en cours...'
            
            # Exécuter la tâche
            result = task_func(*args, **kwargs)
            
            # Mettre à jour le statut
            with self.lock:
                self.tasks[task_id]['status'] = 'SUCCESS'
                self.tasks[task_id]['result'] = result
                self.tasks[task_id]['progress'] = 100
                self.tasks[task_id]['message'] = 'Tâche terminée avec succès'
                
        except Exception as e:
            logger.error(f"Erreur dans la tâche {task_id}: {e}", exc_info=True)
            with self.lock:
                self.tasks[task_id]['status'] = 'FAILURE'
                self.tasks[task_id]['error'] = str(e)
                self.tasks[task_id]['message'] = f'Erreur: {str(e)}'
    
    def update_task_progress(self, task_id: str, progress: int, message: str = None):
        """Met à jour la progression d'une tâche"""
        with self.lock:
            if task_id in self.tasks:
                self.tasks[task_id]['progress'] = progress
                if message:
                    self.tasks[task_id]['message'] = message
                self.tasks[task_id]['status'] = 'PROGRESS'
    
    def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Récupère le statut d'une tâche"""
        with self.lock:
            task = self.tasks.get(task_id)
            if not task:
                return None
            
            # Calculer le temps écoulé
            elapsed = datetime.now() - task['started_at']
            task_copy = task.copy()
            task_copy['elapsed_seconds'] = elapsed.total_seconds()
            
            # Calculer le temps estimé restant si on a une estimation
            if task.get('estimated_duration'):
                remaining = task['estimated_duration'] - elapsed.total_seconds()
                task_copy['estimated_remaining_seconds'] = max(0, remaining)
            
            return task_copy
    
    def set_estimated_duration(self, task_id: str, duration_seconds: int):
        """Définit la durée estimée d'une tâche"""
        with self.lock:
            if task_id in self.tasks:
                self.tasks[task_id]['estimated_duration'] = duration_seconds
                self.tasks[task_id]['estimated_completion'] = (
                    self.tasks[task_id]['started_at'] + timedelta(seconds=duration_seconds)
                )
    
    def cleanup_old_tasks(self, max_age_hours: int = 24):
        """Nettoie les anciennes tâches (plus de max_age_hours)"""
        cutoff = datetime.now() - timedelta(hours=max_age_hours)
        with self.lock:
            to_remove = [
                task_id for task_id, task in self.tasks.items()
                if task['started_at'] < cutoff
            ]
            for task_id in to_remove:
                del self.tasks[task_id]
            if to_remove:
                logger.info(f"Nettoyage de {len(to_remove)} anciennes tâches")


# Instance globale du gestionnaire
task_manager = AsyncTaskManager()

