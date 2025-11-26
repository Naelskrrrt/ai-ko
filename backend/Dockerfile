FROM python:3.13-slim as base

# Dépendances système
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
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
COPY requirements.txt requirements-dev.txt* ./
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install gunicorn celery redis

# Copier code
COPY --chown=appuser:appuser . .

# Utilisateur non-root
USER appuser

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Port
EXPOSE 5000

# Commande par défaut (peut être overridée dans docker-compose)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "run:app"]



