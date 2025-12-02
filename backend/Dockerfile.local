FROM python:3.12-slim

# Dépendances système minimales
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Variables d'environnement
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Créer utilisateur non-root
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app /app/uploads && \
    chown -R appuser:appuser /app

WORKDIR /app

# Copier et installer dépendances Python
# Utiliser requirements-railway.txt si disponible (sans torch), sinon requirements.txt
COPY requirements-railway.txt requirements.txt ./
RUN if [ -f requirements-railway.txt ]; then \
        pip install --no-cache-dir -r requirements-railway.txt; \
    else \
        pip install --no-cache-dir -r requirements.txt && \
        pip install gunicorn; \
    fi

# Copier code
COPY --chown=appuser:appuser . .

# Utilisateur non-root
USER appuser

# Healthcheck - endpoint API correct
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Port par défaut
EXPOSE 5000

# Commande par défaut - utilise shell form pour interpréter $PORT
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-5000} --workers 1 --timeout 180 run:app"]



