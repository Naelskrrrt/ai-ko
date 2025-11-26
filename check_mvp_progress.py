#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de vérification automatique de l'état d'avancement du MVP
Analyse le code existant et génère un rapport basé sur MVP_CHECKLIST.md
"""

import os
import re
import json
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, field
from datetime import datetime

# Gérer l'encodage pour Windows
if sys.platform == 'win32':
    import io
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except AttributeError:
        pass  # stdout/stderr déjà configurés

def safe_print(*args, **kwargs):
    """Print avec gestion d'encodage"""
    try:
        print(*args, **kwargs)
    except UnicodeEncodeError:
        # Remplacer les emojis par du texte simple
        text = ' '.join(str(arg) for arg in args)
        text = text.encode('ascii', 'replace').decode('ascii')
        print(text, **kwargs)

@dataclass
class ChecklistItem:
    """Représente un élément de la checklist"""
    category: str
    item: str
    status: bool = False
    details: str = ""
    file_path: Optional[str] = None
    line_number: Optional[int] = None

@dataclass
class MVPProgress:
    """Rapport de progression du MVP"""
    total_items: int = 0
    completed_items: int = 0
    categories: Dict[str, Dict] = field(default_factory=dict)
    items: List[ChecklistItem] = field(default_factory=list)
    
    @property
    def completion_percentage(self) -> float:
        if self.total_items == 0:
            return 0.0
        return (self.completed_items / self.total_items) * 100

class MVPChecker:
    """Classe principale pour vérifier l'état du MVP"""
    
    def __init__(self, project_root: str = "."):
        self.project_root = Path(project_root).resolve()
        self.backend_path = self.project_root / "backend"
        self.frontend_path = self.project_root / "frontend-nextjs"
        self.progress = MVPProgress()
        
    def check_all(self) -> MVPProgress:
        """Exécute toutes les vérifications"""
        safe_print("🔍 Analyse du projet en cours...\n")
        
        # Vérifications Backend
        self._check_backend_structure()
        self._check_authentication()
        self._check_database_models()
        self._check_api_endpoints()
        self._check_ai_integration()
        self._check_backend_architecture()
        
        # Vérifications Frontend
        self._check_frontend_structure()
        self._check_frontend_pages()
        self._check_frontend_components()
        
        # Vérifications Infrastructure
        self._check_deployment()
        self._check_tests()
        self._check_documentation()
        
        # Calcul des statistiques
        self.progress.total_items = len(self.progress.items)
        self.progress.completed_items = sum(1 for item in self.progress.items if item.status)
        
        return self.progress
    
    def _add_item(self, category: str, item: str, status: bool, 
                  details: str = "", file_path: Optional[str] = None):
        """Ajoute un élément à la checklist"""
        checklist_item = ChecklistItem(
            category=category,
            item=item,
            status=status,
            details=details,
            file_path=file_path
        )
        self.progress.items.append(checklist_item)
        
        # Mise à jour des statistiques par catégorie
        if category not in self.progress.categories:
            self.progress.categories[category] = {
                "total": 0,
                "completed": 0
            }
        self.progress.categories[category]["total"] += 1
        if status:
            self.progress.categories[category]["completed"] += 1
    
    def _file_exists(self, *path_parts) -> bool:
        """Vérifie si un fichier existe"""
        file_path = self.project_root.joinpath(*path_parts)
        return file_path.exists() and file_path.is_file()
    
    def _dir_exists(self, *path_parts) -> bool:
        """Vérifie si un répertoire existe"""
        dir_path = self.project_root.joinpath(*path_parts)
        return dir_path.exists() and dir_path.is_dir()
    
    def _search_in_files(self, pattern: str, *path_parts, 
                        recursive: bool = True) -> List[Tuple[str, int]]:
        """Recherche un pattern dans les fichiers"""
        results = []
        search_path = self.project_root.joinpath(*path_parts)
        
        if not search_path.exists():
            return results
        
        if search_path.is_file():
            files = [search_path]
        elif recursive:
            files = list(search_path.rglob("*.py"))
            files.extend(search_path.rglob("*.ts"))
            files.extend(search_path.rglob("*.tsx"))
            files.extend(search_path.rglob("*.js"))
            files.extend(search_path.rglob("*.jsx"))
        else:
            files = list(search_path.glob("*.py"))
        
        for file_path in files:
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    for line_num, line in enumerate(f, 1):
                        if re.search(pattern, line, re.IGNORECASE):
                            results.append((str(file_path.relative_to(self.project_root)), line_num))
            except Exception:
                continue
        
        return results
    
    def _check_backend_structure(self):
        """Vérifie la structure du backend"""
        safe_print("📁 Vérification structure Backend...")
        
        # Structure Flask
        has_app = self._file_exists("backend", "app.py") or \
                  self._file_exists("backend", "app", "__init__.py")
        self._add_item("Backend", "Structure Flask", has_app, 
                      "app.py ou app/__init__.py")
        
        # Architecture Clean Architecture
        has_repositories = self._dir_exists("backend", "repositories") or \
                          self._search_in_files(r"class.*Repository", "backend")
        has_services = self._dir_exists("backend", "services") or \
                      self._search_in_files(r"class.*Service", "backend")
        has_controllers = self._dir_exists("backend", "controllers") or \
                         self._dir_exists("backend", "api") or \
                         self._search_in_files(r"@.*\.route|Blueprint", "backend")
        
        self._add_item("Backend", "Architecture Clean Architecture (Repository, Service, Controller)",
                      has_repositories and has_services and has_controllers,
                      f"Repositories: {has_repositories}, Services: {has_services}, Controllers: {has_controllers}")
    
    def _check_authentication(self):
        """Vérifie l'authentification"""
        safe_print("🔐 Vérification Authentification...")
        
        # JWT
        has_jwt = self._search_in_files(r"flask_jwt|jwt_extended|jwt", "backend")
        self._add_item("Authentification", "Gestion des sessions (JWT)", len(has_jwt) > 0,
                      f"Trouvé dans {len(has_jwt)} fichier(s)")
        
        # Rôles utilisateurs
        has_roles = self._search_in_files(r"role|enseignant|etudiant|admin", "backend")
        self._add_item("Authentification", "Rôles utilisateurs (Enseignant, Étudiant, Admin)",
                      len(has_roles) > 5, f"Trouvé dans {len(has_roles)} fichier(s)")
        
        # Protection routes
        has_auth_decorator = self._search_in_files(
            r"@.*require|@.*auth|@.*login_required|@.*jwt_required", "backend")
        self._add_item("Authentification", "Protection des routes sensibles par rôle",
                      len(has_auth_decorator) > 0, f"Trouvé dans {len(has_auth_decorator)} fichier(s)")
        
        # Validation
        has_validation = self._search_in_files(r"marshmallow|pydantic|Schema", "backend")
        self._add_item("Authentification", "Validation des données (Marshmallow/Pydantic)",
                      len(has_validation) > 0, f"Trouvé dans {len(has_validation)} fichier(s)")
        
        # CSRF
        has_csrf = self._search_in_files(r"csrf|CSRF|flask_wtf", "backend")
        self._add_item("Authentification", "Protection CSRF (Flask-WTF)",
                      len(has_csrf) > 0, f"Trouvé dans {len(has_csrf)} fichier(s)")
    
    def _check_database_models(self):
        """Vérifie les modèles de base de données"""
        safe_print("💾 Vérification Modèles Base de Données...")
        
        models = {
            "User": r"class User\(|class.*User\(.*Model\)",
            "QCM": r"class QCM\(|class.*QCM\(.*Model\)",
            "Question": r"class Question\(|class.*Question\(.*Model\)",
            "OptionReponse": r"class OptionReponse|class.*Option.*Model",
            "Resultat": r"class Resultat\(|class.*Resultat\(.*Model\)",
            "ReponseComposee": r"class ReponseComposee|class.*Reponse.*Model",
            "Document": r"class Document\(|class.*Document\(.*Model\)",
            "Matiere": r"class Matiere\(|class.*Matiere\(.*Model\)",
            "NiveauParcours": r"class NiveauParcours|class.*Niveau.*Model"
        }
        
        for model_name, pattern in models.items():
            found = self._search_in_files(pattern, "backend")
            self._add_item("Base de Données", f"Modèle {model_name}",
                          len(found) > 0, f"Trouvé dans {len(found)} fichier(s)")
        
        # Migrations
        has_migrations = self._dir_exists("backend", "migrations") or \
                        self._file_exists("backend", "migrations", "versions")
        self._add_item("Base de Données", "Migrations créées (Flask-Migrate)", has_migrations)
    
    def _check_api_endpoints(self):
        """Vérifie les endpoints API"""
        safe_print("🌐 Vérification Endpoints API...")
        
        endpoints = {
            "POST /api/qcm/generate": r"/api/qcm/generate|@.*route.*generate|def.*generate",
            "POST /api/qcm/from-document": r"/api/qcm/from-document|from.*document|upload.*document",
            "GET /api/qcm/preview/{id}": r"/api/qcm/preview|preview.*qcm",
            "POST /api/qcm/{id}/generate-corriges": r"generate.*corrige|corrige.*generate",
            "GET /api/qcm/{id}/corriges": r"/corriges|get.*corrige",
            "POST /api/correction/submit": r"/api/correction/submit|submit.*correction",
            "POST /api/correction/batch": r"correction.*batch|batch.*correction",
            "GET /api/correction/results/{etudiant_id}": r"correction.*results|results.*correction",
            "GET /api/evaluation/{resultat_id}": r"/api/evaluation|evaluation.*resultat",
            "POST /api/evaluation/feedback": r"evaluation.*feedback|feedback.*evaluation",
            "GET /api/statistics/enseignant/dashboard": r"statistics.*enseignant|enseignant.*dashboard",
            "GET /api/statistics/etudiant/dashboard": r"statistics.*etudiant|etudiant.*dashboard",
            "GET /api/statistics/export/csv": r"export.*csv|statistics.*export"
        }
        
        for endpoint, pattern in endpoints.items():
            found = self._search_in_files(pattern, "backend")
            self._add_item("API Endpoints", endpoint, len(found) > 0,
                          f"Trouvé dans {len(found)} fichier(s)")
    
    def _check_ai_integration(self):
        """Vérifie l'intégration IA"""
        safe_print("🤖 Vérification Intégration IA...")
        
        # Hugging Face
        has_hf = self._search_in_files(r"huggingface|transformers|from transformers", "backend")
        self._add_item("IA/ML", "Intégration Hugging Face", len(has_hf) > 0,
                      f"Trouvé dans {len(has_hf)} fichier(s)")
        
        # Modèles spécifiques
        models = {
            "T5": r"T5|t5-base|T5ForConditionalGeneration",
            "BERT": r"BERT|bert-base|BertModel",
            "Sentence-BERT": r"sentence.*bert|SentenceTransformer|sentence-transformers",
            "GPT-2": r"GPT2|gpt2|GPT2LMHeadModel"
        }
        
        for model_name, pattern in models.items():
            found = self._search_in_files(pattern, "backend")
            self._add_item("IA/ML", f"Modèle {model_name} configuré",
                          len(found) > 0, f"Trouvé dans {len(found)} fichier(s)")
        
        # Génération questions
        has_generation = self._search_in_files(
            r"generate.*question|question.*generate|generate_questions", "backend")
        self._add_item("Module 1", "Génération de questions avec T5/GPT-2",
                      len(has_generation) > 0, f"Trouvé dans {len(has_generation)} fichier(s)")
        
        # Correction automatique
        has_correction = self._search_in_files(
            r"correct|similarity|semantic|embedding", "backend")
        self._add_item("Module 3", "Correction automatique (similarité sémantique)",
                      len(has_correction) > 5, f"Trouvé dans {len(has_correction)} fichier(s)")
        
        # Upload documents
        has_upload = self._search_in_files(
            r"upload|PyPDF2|python-docx|extract.*text", "backend")
        self._add_item("Module 1", "Upload et extraction de documents (PDF, DOCX, TXT)",
                      len(has_upload) > 0, f"Trouvé dans {len(has_upload)} fichier(s)")
    
    def _check_backend_architecture(self):
        """Vérifie l'architecture backend"""
        safe_print("🏗️ Vérification Architecture Backend...")
        
        # Celery
        has_celery = self._search_in_files(r"celery|@celery|Celery", "backend")
        self._add_item("Backend", "Celery pour tâches asynchrones",
                      len(has_celery) > 0, f"Trouvé dans {len(has_celery)} fichier(s)")
        
        # Rate limiting
        has_rate_limit = self._search_in_files(r"rate.*limit|flask.*limiter|Limiter", "backend")
        self._add_item("Backend", "Rate limiting (Flask-Limiter)",
                      len(has_rate_limit) > 0, f"Trouvé dans {len(has_rate_limit)} fichier(s)")
        
        # Logging
        has_logging = self._search_in_files(r"logging|logger|log.*json", "backend")
        self._add_item("Backend", "Logs structurés configurés",
                      len(has_logging) > 3, f"Trouvé dans {len(has_logging)} fichier(s)")
        
        # Health check
        has_health = self._search_in_files(r"/health|health.*check|healthcheck", "backend")
        self._add_item("Déploiement", "Health check endpoint (/health)",
                      len(has_health) > 0, f"Trouvé dans {len(has_health)} fichier(s)")
    
    def _check_frontend_structure(self):
        """Vérifie la structure du frontend"""
        safe_print("🎨 Vérification structure Frontend...")
        
        # Next.js ou React
        has_nextjs = self._file_exists("frontend-nextjs", "next.config.js") or \
                     self._file_exists("frontend-nextjs", "next.config.mjs") or \
                     self._file_exists("frontend-nextjs", "package.json")
        has_react = self._file_exists("frontend-nextjs", "package.json") or \
                   self._dir_exists("frontend-nextjs", "src")
        
        if has_nextjs:
            # Vérifier App Router
            has_app_router = self._dir_exists("frontend-nextjs", "app")
            self._add_item("Frontend", "Next.js 15+ avec App Router",
                          has_app_router, "Structure app/ trouvée")
        elif has_react:
            self._add_item("Frontend", "React + Vite",
                          True, "Structure React détectée")
        else:
            self._add_item("Frontend", "Framework Frontend",
                          False, "Aucun framework détecté")
        
        # Responsive
        has_tailwind = self._search_in_files(r"tailwind|@tailwind", "frontend-nextjs")
        has_responsive = self._search_in_files(r"responsive|md:|lg:|sm:", "frontend-nextjs")
        self._add_item("Frontend", "Interface responsive (mobile-friendly)",
                      len(has_tailwind) > 0 or len(has_responsive) > 0,
                      f"Tailwind: {len(has_tailwind)}, Responsive: {len(has_responsive)}")
    
    def _check_frontend_pages(self):
        """Vérifie les pages frontend"""
        safe_print("📄 Vérification Pages Frontend...")
        
        pages = {
            "Login/Register": r"login|register|auth",
            "Dashboard enseignant": r"enseignant|teacher|dashboard.*enseignant",
            "Dashboard étudiant": r"etudiant|student|dashboard.*etudiant",
            "Création QCM": r"create.*qcm|nouveau.*qcm|qcm.*create|generate.*qcm",
            "Passage examen": r"exam|examen|take.*exam",
            "Visualisation résultats": r"result|resultat|score|grade"
        }
        
        for page_name, pattern in pages.items():
            found = self._search_in_files(pattern, "frontend-nextjs")
            self._add_item("Frontend Pages", page_name,
                          len(found) > 0, f"Trouvé dans {len(found)} fichier(s)")
    
    def _check_frontend_components(self):
        """Vérifie les composants frontend"""
        safe_print("🧩 Vérification Composants Frontend...")
        
        # Loading states
        has_loading = self._search_in_files(r"loading|Loading|Skeleton|spinner", "frontend-nextjs")
        self._add_item("Frontend", "États de chargement (loading states)",
                      len(has_loading) > 0, f"Trouvé dans {len(has_loading)} fichier(s)")
        
        # Error handling
        has_error = self._search_in_files(r"error|Error|catch|try.*catch", "frontend-nextjs")
        self._add_item("Frontend", "Gestion des erreurs côté client",
                      len(has_error) > 3, f"Trouvé dans {len(has_error)} fichier(s)")
        
        # Toast/Notifications
        has_toast = self._search_in_files(r"toast|Toast|notification|Notification", "frontend-nextjs")
        self._add_item("Frontend", "Feedback utilisateur (toasts, messages)",
                      len(has_toast) > 0, f"Trouvé dans {len(has_toast)} fichier(s)")
    
    def _check_deployment(self):
        """Vérifie le déploiement"""
        safe_print("🚀 Vérification Déploiement...")
        
        # Docker
        has_docker = self._file_exists("docker-compose.yml") or \
                    self._file_exists("docker-compose.yaml") or \
                    self._file_exists("Dockerfile")
        self._add_item("Déploiement", "Docker Compose configuré", has_docker)
        
        # CI/CD
        has_cicd = self._dir_exists(".github", "workflows") or \
                  self._file_exists(".gitlab-ci.yml") or \
                  self._file_exists("Jenkinsfile")
        self._add_item("Déploiement", "CI/CD configuré (GitHub Actions)", has_cicd)
        
        # .env
        has_env = self._file_exists(".env.example") or \
                 self._file_exists(".env.template") or \
                 self._file_exists("backend", ".env.example")
        self._add_item("Déploiement", "Variables d'environnement documentées (.env.example)",
                      has_env)
    
    def _check_tests(self):
        """Vérifie les tests"""
        safe_print("🧪 Vérification Tests...")
        
        # Tests backend
        has_backend_tests = self._dir_exists("backend", "tests") or \
                           self._dir_exists("backend", "test") or \
                           self._search_in_files(r"def test_|pytest|unittest", "backend")
        self._add_item("Tests", "Tests backend (pytest/unittest)",
                      len(has_backend_tests) > 0 if isinstance(has_backend_tests, list) else has_backend_tests,
                      "Tests trouvés" if has_backend_tests else "Aucun test trouvé")
        
        # Tests frontend
        has_frontend_tests = self._dir_exists("frontend-nextjs", "__tests__") or \
                            self._dir_exists("frontend-nextjs", "tests") or \
                            self._search_in_files(r"\.test\.|\.spec\.|describe\(|it\(", "frontend-nextjs")
        self._add_item("Tests", "Tests frontend (Jest/Vitest)",
                      len(has_frontend_tests) > 0 if isinstance(has_frontend_tests, list) else has_frontend_tests,
                      "Tests trouvés" if has_frontend_tests else "Aucun test trouvé")
    
    def _check_documentation(self):
        """Vérifie la documentation"""
        safe_print("📚 Vérification Documentation...")
        
        # README
        has_readme = self._file_exists("README.md") or \
                    self._file_exists("README.rst")
        self._add_item("Documentation", "README avec instructions d'installation",
                      has_readme)
        
        # API docs
        has_api_docs = self._search_in_files(r"swagger|openapi|api.*doc", "backend") or \
                      self._file_exists("docs", "api.md")
        self._add_item("Documentation", "Documentation API (Swagger/OpenAPI)",
                      len(has_api_docs) > 0 if isinstance(has_api_docs, list) else has_api_docs)

def generate_report(progress: MVPProgress, output_format: str = "markdown") -> str:
    """Génère un rapport de progression"""
    
    if output_format == "markdown":
        return _generate_markdown_report(progress)
    elif output_format == "html":
        return _generate_html_report(progress)
    elif output_format == "json":
        return _generate_json_report(progress)
    else:
        raise ValueError(f"Format non supporté: {output_format}")

def _generate_markdown_report(progress: MVPProgress) -> str:
    """Génère un rapport Markdown"""
    lines = []
    lines.append("# 📊 Rapport de Progression MVP\n")
    lines.append(f"**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    lines.append(f"**Progression globale:** {progress.completion_percentage:.1f}% "
                f"({progress.completed_items}/{progress.total_items} items)\n")
    lines.append("\n---\n")
    
    # Statistiques par catégorie
    lines.append("## 📈 Statistiques par Catégorie\n")
    lines.append("| Catégorie | Complété | Total | Pourcentage |")
    lines.append("|-----------|----------|-------|-------------|")
    
    for category, stats in sorted(progress.categories.items()):
        pct = (stats["completed"] / stats["total"] * 100) if stats["total"] > 0 else 0
        lines.append(f"| {category} | {stats['completed']} | {stats['total']} | {pct:.1f}% |")
    
    lines.append("\n---\n")
    
    # Détails par catégorie
    current_category = None
    for item in sorted(progress.items, key=lambda x: (x.category, x.item)):
        if item.category != current_category:
            current_category = item.category
            lines.append(f"\n## {current_category}\n")
        
        status_icon = "✅" if item.status else "❌"
        lines.append(f"- {status_icon} **{item.item}**")
        if item.details:
            lines.append(f"  - *{item.details}*")
        if item.file_path:
            lines.append(f"  - 📁 `{item.file_path}`")
    
    return "\n".join(lines)

def _generate_html_report(progress: MVPProgress) -> str:
    """Génère un rapport HTML"""
    html = f"""
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport MVP - {progress.completion_percentage:.1f}%</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }}
        h1 {{ color: #333; }}
        .progress-bar {{ width: 100%; height: 30px; background: #e0e0e0; border-radius: 15px; overflow: hidden; margin: 20px 0; }}
        .progress-fill {{ height: 100%; background: linear-gradient(90deg, #4CAF50, #45a049); transition: width 0.3s; }}
        .stats {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin: 20px 0; }}
        .stat-card {{ background: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #4CAF50; }}
        .category {{ margin: 30px 0; }}
        .item {{ padding: 10px; margin: 5px 0; background: #f9f9f9; border-radius: 5px; }}
        .item.completed {{ border-left: 4px solid #4CAF50; }}
        .item.pending {{ border-left: 4px solid #f44336; }}
        .details {{ font-size: 0.9em; color: #666; margin-top: 5px; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Rapport de Progression MVP</h1>
        <p><strong>Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        
        <div class="progress-bar">
            <div class="progress-fill" style="width: {progress.completion_percentage}%"></div>
        </div>
        <p style="text-align: center; font-size: 1.2em;">
            <strong>{progress.completion_percentage:.1f}%</strong> 
            ({progress.completed_items}/{progress.total_items} items)
        </p>
        
        <div class="stats">
"""
    
    for category, stats in sorted(progress.categories.items()):
        pct = (stats["completed"] / stats["total"] * 100) if stats["total"] > 0 else 0
        html += f"""
            <div class="stat-card">
                <h3>{category}</h3>
                <p>{stats['completed']}/{stats['total']} ({pct:.1f}%)</p>
            </div>
"""
    
    html += """
        </div>
        
        <h2>Détails par Catégorie</h2>
"""
    
    current_category = None
    for item in sorted(progress.items, key=lambda x: (x.category, x.item)):
        if item.category != current_category:
            current_category = item.category
            html += f'<div class="category"><h3>{current_category}</h3></div>'
        
        status_class = "completed" if item.status else "pending"
        status_icon = "✅" if item.status else "❌"
        html += f"""
        <div class="item {status_class}">
            <strong>{status_icon} {item.item}</strong>
"""
        if item.details:
            html += f'<div class="details">{item.details}</div>'
        if item.file_path:
            html += f'<div class="details">📁 {item.file_path}</div>'
        html += "</div>"
    
    html += """
    </div>
</body>
</html>
"""
    return html

def _generate_json_report(progress: MVPProgress) -> str:
    """Génère un rapport JSON"""
    data = {
        "date": datetime.now().isoformat(),
        "completion_percentage": progress.completion_percentage,
        "total_items": progress.total_items,
        "completed_items": progress.completed_items,
        "categories": progress.categories,
        "items": [
            {
                "category": item.category,
                "item": item.item,
                "status": item.status,
                "details": item.details,
                "file_path": item.file_path
            }
            for item in progress.items
        ]
    }
    return json.dumps(data, indent=2, ensure_ascii=False)

def main():
    """Point d'entrée principal"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Vérifie l'état d'avancement du MVP"
    )
    parser.add_argument(
        "--format", "-f",
        choices=["markdown", "html", "json"],
        default="markdown",
        help="Format de sortie (default: markdown)"
    )
    parser.add_argument(
        "--output", "-o",
        help="Fichier de sortie (default: stdout)"
    )
    parser.add_argument(
        "--project-root",
        default=".",
        help="Racine du projet (default: .)"
    )
    
    args = parser.parse_args()
    
    # Exécution des vérifications
    checker = MVPChecker(args.project_root)
    progress = checker.check_all()
    
    # Génération du rapport
    report = generate_report(progress, args.format)
    
    # Affichage ou sauvegarde
    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(report)
        safe_print(f"\n✅ Rapport généré: {output_path}")
        safe_print(f"📊 Progression: {progress.completion_percentage:.1f}% "
              f"({progress.completed_items}/{progress.total_items} items)")
    else:
        print(report)

if __name__ == "__main__":
    main()

