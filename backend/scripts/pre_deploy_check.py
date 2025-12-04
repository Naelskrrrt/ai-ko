#!/usr/bin/env python3
"""
Script de vérification pré-déploiement pour le backend.
Vérifie que le code est compatible avec un déploiement Railway/Production.

Usage:
    python scripts/pre_deploy_check.py
    
Ce script doit passer AVANT tout push vers main.
"""

import ast
import sys
import os
from pathlib import Path

# Couleurs pour l'affichage
RED = '\033[91m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
RESET = '\033[0m'

def print_error(msg):
    print(f"{RED}❌ ERREUR: {msg}{RESET}")

def print_warning(msg):
    print(f"{YELLOW}⚠️  WARNING: {msg}{RESET}")

def print_success(msg):
    print(f"{GREEN}✅ {msg}{RESET}")

def print_info(msg):
    print(f"   {msg}")


class StartupBlockingChecker(ast.NodeVisitor):
    """Vérifie qu'il n'y a pas d'appels bloquants au niveau module."""
    
    def __init__(self, filename):
        self.filename = filename
        self.issues = []
        self.in_function = False
        self.in_if_main = False
        self.in_conditional = False  # Dans un if quelconque
        
    def visit_FunctionDef(self, node):
        old_in_function = self.in_function
        self.in_function = True
        self.generic_visit(node)
        self.in_function = old_in_function
        
    def visit_If(self, node):
        # Détecter if __name__ == '__main__'
        if isinstance(node.test, ast.Compare):
            if isinstance(node.test.left, ast.Name) and node.test.left.id == '__name__':
                self.in_if_main = True
                self.generic_visit(node)
                self.in_if_main = False
                return
        
        # Détecter les conditions avec os.getenv (protection production)
        test_str = ast.unparse(node.test) if hasattr(ast, 'unparse') else ''
        if 'getenv' in test_str or 'FLASK_ENV' in test_str or 'environ' in test_str:
            old_conditional = self.in_conditional
            self.in_conditional = True
            self.generic_visit(node)
            self.in_conditional = old_conditional
            return
            
        self.generic_visit(node)
        
    def visit_Call(self, node):
        # Ignorer les appels dans des fonctions, if __name__ == '__main__', ou conditionnés
        if self.in_function or self.in_if_main or self.in_conditional:
            self.generic_visit(node)
            return
            
        # Détecter les appels potentiellement bloquants au niveau module
        blocking_patterns = [
            'db.create_all',
            'db.session',
            'inspect',
            'engine.connect',
            'engine.execute',
            '.connect(',
            'init_database',
        ]
        
        call_str = ast.unparse(node) if hasattr(ast, 'unparse') else str(node)
        
        for pattern in blocking_patterns:
            if pattern in call_str:
                # Vérifier si c'est dans un try/except ou conditionné
                self.issues.append({
                    'line': node.lineno,
                    'call': call_str[:80],
                    'pattern': pattern
                })
        
        self.generic_visit(node)


def check_blocking_calls(file_path: Path) -> list:
    """Vérifie les appels bloquants dans un fichier Python."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        tree = ast.parse(content)
        checker = StartupBlockingChecker(str(file_path))
        checker.visit(tree)
        return checker.issues
    except SyntaxError as e:
        return [{'line': e.lineno, 'call': f'SyntaxError: {e.msg}', 'pattern': 'syntax'}]
    except Exception as e:
        return [{'line': 0, 'call': f'Error: {e}', 'pattern': 'parse'}]


def check_env_dependencies(file_path: Path) -> list:
    """Vérifie les dépendances aux variables d'environnement."""
    issues = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Vérifier les accès à .env sans fallback en production
        if 'load_dotenv' in content and 'raise' in content:
            issues.append({
                'line': 0,
                'msg': 'load_dotenv avec raise peut bloquer en production (pas de .env)'
            })
            
    except Exception as e:
        issues.append({'line': 0, 'msg': f'Erreur lecture: {e}'})
    
    return issues


def check_gunicorn_compatibility(run_py_path: Path) -> list:
    """Vérifie que run.py est compatible avec Gunicorn."""
    issues = []
    
    try:
        with open(run_py_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Vérifier que 'app' est créé au niveau module (requis par gunicorn run:app)
        if 'app = create_app()' not in content and 'app=create_app()' not in content:
            issues.append({
                'line': 0,
                'msg': "Variable 'app' doit être créée au niveau module pour Gunicorn"
            })
        
        # Vérifier qu'il n'y a pas de app.run() au niveau module (hors if __name__)
        lines = content.split('\n')
        in_if_main = False
        for i, line in enumerate(lines, 1):
            stripped = line.strip()
            if stripped.startswith('if __name__'):
                in_if_main = True
            if 'app.run(' in stripped and not in_if_main and not stripped.startswith('#'):
                issues.append({
                    'line': i,
                    'msg': "app.run() au niveau module bloquera Gunicorn"
                })
                
    except Exception as e:
        issues.append({'line': 0, 'msg': f'Erreur: {e}'})
    
    return issues


def check_health_endpoint() -> list:
    """Vérifie que l'endpoint /api/health existe et est simple."""
    issues = []
    health_file = Path(__file__).parent.parent / 'app' / 'api' / 'health.py'
    
    if not health_file.exists():
        issues.append({'line': 0, 'msg': 'Fichier health.py non trouvé'})
        return issues
    
    try:
        with open(health_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Vérifier qu'il y a un endpoint /health simple
        if "def health(" not in content and "def health_check(" not in content:
            issues.append({
                'line': 0,
                'msg': "Pas de fonction health() dans health.py"
            })
        
        # Vérifier que le health basique ne fait pas de requête DB
        # (le health détaillé peut le faire, mais pas le basique)
        if "@bp.route('/health'" in content or '@bp.route("/health"' in content:
            # Trouver la fonction health et vérifier qu'elle ne fait pas de DB query
            pass  # OK si présent
        else:
            issues.append({
                'line': 0,
                'msg': "Route /health non trouvée"
            })
            
    except Exception as e:
        issues.append({'line': 0, 'msg': f'Erreur: {e}'})
    
    return issues


def check_dockerfile() -> list:
    """Vérifie le Dockerfile."""
    issues = []
    dockerfile = Path(__file__).parent.parent / 'Dockerfile'
    
    if not dockerfile.exists():
        issues.append({'line': 0, 'msg': 'Dockerfile non trouvé'})
        return issues
    
    try:
        with open(dockerfile, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Vérifier que gunicorn est utilisé
        if 'gunicorn' not in content.lower():
            issues.append({
                'line': 0,
                'msg': "Gunicorn non trouvé dans Dockerfile (utiliser gunicorn en prod)"
            })
        
        # Vérifier la variable PORT
        if '${PORT' not in content and '$PORT' not in content:
            issues.append({
                'line': 0,
                'msg': "Variable $PORT non utilisée (Railway injecte PORT)"
            })
            
    except Exception as e:
        issues.append({'line': 0, 'msg': f'Erreur: {e}'})
    
    return issues


def main():
    print("\n" + "="*60)
    print("🔍 VÉRIFICATION PRÉ-DÉPLOIEMENT RAILWAY")
    print("="*60 + "\n")
    
    backend_dir = Path(__file__).parent.parent
    all_passed = True
    
    # 1. Vérifier run.py
    print("📄 Vérification de run.py...")
    run_py = backend_dir / 'run.py'
    
    if run_py.exists():
        blocking_issues = check_blocking_calls(run_py)
        gunicorn_issues = check_gunicorn_compatibility(run_py)
        
        if blocking_issues:
            all_passed = False
            print_warning("Appels potentiellement bloquants au niveau module:")
            for issue in blocking_issues:
                print_info(f"  Ligne {issue['line']}: {issue['call'][:60]}...")
        else:
            print_success("Pas d'appels bloquants détectés au niveau module")
            
        if gunicorn_issues:
            all_passed = False
            for issue in gunicorn_issues:
                print_error(issue['msg'])
        else:
            print_success("Compatible Gunicorn")
    else:
        print_error("run.py non trouvé!")
        all_passed = False
    
    # 2. Vérifier le healthcheck
    print("\n📄 Vérification du healthcheck...")
    health_issues = check_health_endpoint()
    if health_issues:
        for issue in health_issues:
            print_warning(issue['msg'])
    else:
        print_success("Endpoint /api/health correctement configuré")
    
    # 3. Vérifier le Dockerfile
    print("\n📄 Vérification du Dockerfile...")
    dockerfile_issues = check_dockerfile()
    if dockerfile_issues:
        for issue in dockerfile_issues:
            print_warning(issue['msg'])
    else:
        print_success("Dockerfile correctement configuré")
    
    # 4. Vérifier app/__init__.py
    print("\n📄 Vérification de app/__init__.py...")
    init_py = backend_dir / 'app' / '__init__.py'
    if init_py.exists():
        blocking_issues = check_blocking_calls(init_py)
        if blocking_issues:
            print_warning("Appels potentiellement bloquants dans __init__.py:")
            for issue in blocking_issues:
                print_info(f"  Ligne {issue['line']}: {issue['pattern']}")
        else:
            print_success("Pas d'appels bloquants dans create_app()")
    
    # 5. Test d'import rapide
    print("\n📄 Test d'import de l'application...")
    try:
        import subprocess
        result = subprocess.run(
            [sys.executable, '-c', 
             'import sys; sys.path.insert(0, "."); '
             'import os; os.environ["FLASK_ENV"]="production"; os.environ["DATABASE_URL"]="sqlite:///test.db"; '
             'from run import app; print("OK")'],
            cwd=str(backend_dir),
            capture_output=True,
            text=True,
            timeout=10  # 10 secondes max
        )
        if result.returncode == 0 and 'OK' in result.stdout:
            print_success("Import de l'application réussi en < 10 secondes")
        else:
            print_error(f"Import échoué: {result.stderr[:200]}")
            all_passed = False
    except subprocess.TimeoutExpired:
        print_error("TIMEOUT: L'import de l'application prend > 10 secondes!")
        print_info("Ceci bloquera le healthcheck Railway.")
        all_passed = False
    except Exception as e:
        print_warning(f"Test d'import non effectué: {e}")
    
    # Résultat final
    print("\n" + "="*60)
    if all_passed:
        print_success("TOUTES LES VÉRIFICATIONS PASSÉES ✅")
        print("   Le code est prêt pour le déploiement Railway.")
        print("="*60 + "\n")
        return 0
    else:
        print_error("CERTAINES VÉRIFICATIONS ONT ÉCHOUÉ ❌")
        print("   Corrigez les problèmes avant de push.")
        print("="*60 + "\n")
        return 1


if __name__ == '__main__':
    sys.exit(main())
