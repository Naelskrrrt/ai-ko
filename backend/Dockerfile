# Dockerfile optimisé pour Railway
FROM python:3.12-slim

# Dépendances système minimales
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Variables d'environnement
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Copier et installer dépendances Python optimisées (sans torch/transformers)
COPY requirements-railway.txt ./
RUN pip install --no-cache-dir -r requirements-railway.txt

# Copier le code
COPY . .

# Port (Railway utilise $PORT)
EXPOSE 5000

# Commande de démarrage - shell form pour interpréter $PORT
# - workers 1 : IMPORTANT - un seul worker pour que le task_manager en mémoire fonctionne
#               (les tâches asynchrones sont stockées en mémoire, pas en Redis)
# - threads 4 : threads par worker pour gérer la concurrence
# - timeout 180 : timeout plus long pour la génération de QCM
# - keep-alive 5 : maintient les connexions
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-5000} --workers 1 --threads 4 --timeout 180 --keep-alive 5 run:app"]
