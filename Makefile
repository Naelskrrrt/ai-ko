# ===============================================
# Makefile - AI-KO Project
# ===============================================
# Usage: make <command>
# ===============================================

.PHONY: help dev prod up down logs build clean test migrate

# Default target
help:
	@echo "=========================================="
	@echo "  AI-KO Project - Available Commands"
	@echo "=========================================="
	@echo ""
	@echo "Environment:"
	@echo "  make dev              - Switch to development environment"
	@echo "  make prod             - Switch to production environment"
	@echo ""
	@echo "Docker (Development):"
	@echo "  make up               - Start all services"
	@echo "  make down             - Stop all services"
	@echo "  make restart          - Restart all services"
	@echo "  make build            - Rebuild all services"
	@echo "  make logs             - Show all logs"
	@echo "  make logs-backend     - Show backend logs"
	@echo "  make logs-frontend    - Show frontend logs"
	@echo "  make ps               - Show running services"
	@echo "  make clean            - Stop and remove all containers, volumes"
	@echo ""
	@echo "Database:"
	@echo "  make migrate          - Run database migrations"
	@echo "  make migrate-create   - Create a new migration"
	@echo "  make db-shell         - Open PostgreSQL shell"
	@echo ""
	@echo "Development:"
	@echo "  make shell-backend    - Open backend container shell"
	@echo "  make test             - Run backend tests"
	@echo "  make test-cov         - Run tests with coverage"
	@echo ""
	@echo "Production:"
	@echo "  make deploy-backend   - Deploy backend to Railway"
	@echo "  make deploy-frontend  - Deploy frontend to Vercel"
	@echo ""

# Environment switching
dev:
	@if [ -f "switch-env.sh" ]; then \
		./switch-env.sh dev; \
	else \
		powershell -ExecutionPolicy Bypass -File switch-env.ps1 dev; \
	fi

prod:
	@if [ -f "switch-env.sh" ]; then \
		./switch-env.sh prod; \
	else \
		powershell -ExecutionPolicy Bypass -File switch-env.ps1 prod; \
	fi

# Docker commands
up:
	docker-compose -f docker-compose.dev.yml up -d

down:
	docker-compose down

restart: down up

build:
	docker-compose -f docker-compose.dev.yml up -d --build

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-celery:
	docker-compose logs -f celery_worker

ps:
	docker-compose ps

clean:
	docker-compose down -v
	docker system prune -f

# Database commands
migrate:
	docker-compose exec backend flask db upgrade

migrate-create:
	@read -p "Migration name: " name; \
	docker-compose exec backend flask db migrate -m "$$name"

db-shell:
	docker-compose exec postgres psql -U root systeme_intelligent_dev

# Development commands
shell-backend:
	docker-compose exec backend bash

shell-redis:
	docker-compose exec redis redis-cli -a root

test:
	docker-compose exec backend pytest

test-cov:
	docker-compose exec backend pytest --cov=app --cov-report=html

# Production deployment
deploy-check:
	@echo "🔍 Vérification pré-déploiement..."
	cd backend && python scripts/pre_deploy_check.py

deploy-backend: deploy-check
	cd backend && railway up

deploy-frontend:
	cd frontend && vercel --prod

install-hooks:
	@echo "📦 Installation des hooks Git..."
	cd backend && bash scripts/install-hooks.sh

# Health checks
health:
	@echo "Checking services health..."
	@curl -s http://localhost:5000/health || echo "Backend: DOWN"
	@curl -s http://localhost:3000/api/health || echo "Frontend: DOWN"
