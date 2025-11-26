"""
Script de correction automatique des problèmes API détectés
"""
import requests
import json
import sys
from typing import Dict, List, Optional

BASE_URL = "http://localhost:5000"

class APIFixer:
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.token_admin: Optional[str] = None
        
    def log(self, message: str, level: str = "INFO"):
        """Log avec timestamp"""
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
    
    def check_server_running(self):
        """Vérifie si le serveur backend est en cours d'exécution"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=2)
            return response.status_code == 200
        except:
            return False
    
    def authenticate(self):
        """Authentifie en tant qu'admin"""
        # Vérifier d'abord si le serveur est en cours d'exécution
        if not self.check_server_running():
            self.log("❌ Le serveur backend n'est pas en cours d'exécution", "ERROR")
            self.log("", "ERROR")
            self.log("💡 Pour démarrer le serveur:", "ERROR")
            self.log("", "ERROR")
            self.log("   Option 1 - Script automatique (Git Bash):", "ERROR")
            self.log("     ./start_backend_gitbash.sh", "ERROR")
            self.log("", "ERROR")
            self.log("   Option 2 - Manuellement (Git Bash):", "ERROR")
            self.log("     1. cd backend", "ERROR")
            self.log("     2. source venv/Scripts/activate", "ERROR")
            self.log("     3. python run.py", "ERROR")
            self.log("", "ERROR")
            self.log("   Option 3 - PowerShell:", "ERROR")
            self.log("     .\\start-backend.ps1", "ERROR")
            self.log("", "ERROR")
            self.log("   Option 4 - Docker:", "ERROR")
            self.log("     docker-compose up backend", "ERROR")
            return False
        
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/login",
                json={"email": "admin@test.com", "password": "admin123"},
                timeout=5
            )
            if response.status_code == 200:
                self.token_admin = response.json().get("token")
                self.log("✅ Authentification admin réussie")
                return True
        except:
            pass
        
        # Essayer de créer l'admin
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/register",
                json={
                    "email": "admin@test.com",
                    "password": "admin123",
                    "name": "Admin Test",
                    "role": "admin"
                },
                timeout=5
            )
            if response.status_code in [200, 201]:
                # Réessayer de se connecter
                response = requests.post(
                    f"{self.base_url}/api/auth/login",
                    json={"email": "admin@test.com", "password": "admin123"},
                    timeout=5
                )
                if response.status_code == 200:
                    self.token_admin = response.json().get("token")
                    self.log("✅ Admin créé et authentifié")
                    return True
        except:
            pass
        
        self.log("❌ Impossible de s'authentifier", "ERROR")
        return False
    
    def fix_missing_niveaux(self):
        """Crée les niveaux manquants si nécessaire"""
        if not self.token_admin:
            return False
        
        self.log("🔍 Vérification des niveaux...")
        
        try:
            response = requests.get(f"{self.base_url}/api/niveaux", timeout=5)
            if response.status_code == 200:
                niveaux = response.json()
                if isinstance(niveaux, list) and len(niveaux) > 0:
                    self.log(f"✅ {len(niveaux)} niveau(x) trouvé(s)")
                    return True
                
                # Créer les niveaux de base
                self.log("📝 Création des niveaux de base...")
                niveaux_to_create = [
                    {"code": "L1", "nom": "Licence 1", "ordre": 1, "cycle": "licence"},
                    {"code": "L2", "nom": "Licence 2", "ordre": 2, "cycle": "licence"},
                    {"code": "L3", "nom": "Licence 3", "ordre": 3, "cycle": "licence"},
                    {"code": "M1", "nom": "Master 1", "ordre": 4, "cycle": "master"},
                    {"code": "M2", "nom": "Master 2", "ordre": 5, "cycle": "master"},
                    {"code": "D", "nom": "Doctorat", "ordre": 6, "cycle": "doctorat"}
                ]
                
                headers = {"Authorization": f"Bearer {self.token_admin}"}
                created = 0
                for niveau in niveaux_to_create:
                    try:
                        response = requests.post(
                            f"{self.base_url}/api/niveaux",
                            json=niveau,
                            headers=headers,
                            timeout=5
                        )
                        if response.status_code == 201:
                            created += 1
                    except:
                        pass
                
                self.log(f"✅ {created} niveau(x) créé(s)")
                return True
        except Exception as e:
            self.log(f"❌ Erreur lors de la vérification des niveaux: {str(e)}", "ERROR")
        
        return False
    
    def fix_missing_matieres(self):
        """Crée les matières de base si nécessaire"""
        if not self.token_admin:
            return False
        
        self.log("🔍 Vérification des matières...")
        
        try:
            response = requests.get(f"{self.base_url}/api/matieres", timeout=5)
            if response.status_code == 200:
                matieres = response.json()
                if isinstance(matieres, list) and len(matieres) > 0:
                    self.log(f"✅ {len(matieres)} matière(s) trouvée(s)")
                    return True
                
                # Créer quelques matières de base
                self.log("📝 Création des matières de base...")
                matieres_to_create = [
                    {"code": "INFO101", "nom": "Programmation Python", "coefficient": 1.0},
                    {"code": "INFO102", "nom": "Algorithmique", "coefficient": 1.0},
                    {"code": "INFO103", "nom": "Bases de données", "coefficient": 1.0}
                ]
                
                headers = {"Authorization": f"Bearer {self.token_admin}"}
                created = 0
                for matiere in matieres_to_create:
                    try:
                        response = requests.post(
                            f"{self.base_url}/api/matieres",
                            json=matiere,
                            headers=headers,
                            timeout=5
                        )
                        if response.status_code == 201:
                            created += 1
                    except:
                        pass
                
                self.log(f"✅ {created} matière(s) créée(s)")
                return True
        except Exception as e:
            self.log(f"❌ Erreur lors de la vérification des matières: {str(e)}", "ERROR")
        
        return False
    
    def fix_database_connection(self):
        """Vérifie la connexion à la base de données"""
        self.log("🔍 Vérification de la connexion à la base de données...")
        
        try:
            response = requests.get(f"{self.base_url}/health/detailed", timeout=5)
            if response.status_code == 200:
                data = response.json()
                db_status = data.get("database", "unknown")
                if db_status == "healthy":
                    self.log("✅ Base de données connectée")
                    return True
                else:
                    self.log(f"⚠️ Base de données: {db_status}", "WARN")
                    self.log("   Exécutez: flask db upgrade", "WARN")
        except Exception as e:
            self.log(f"❌ Erreur de connexion: {str(e)}", "ERROR")
        
        return False
    
    def fix_all(self):
        """Corrige tous les problèmes détectés"""
        self.log("🔧 DÉMARRAGE DE LA CORRECTION AUTOMATIQUE")
        self.log("=" * 60)
        
        # Authentification
        if not self.authenticate():
            self.log("❌ Impossible de continuer sans authentification", "ERROR")
            return False
        
        # Vérifications et corrections
        fixes = [
            ("Connexion DB", self.fix_database_connection),
            ("Niveaux", self.fix_missing_niveaux),
            ("Matières", self.fix_missing_matieres)
        ]
        
        results = {}
        for name, fix_func in fixes:
            try:
                results[name] = fix_func()
            except Exception as e:
                self.log(f"❌ Erreur lors de la correction '{name}': {str(e)}", "ERROR")
                results[name] = False
        
        # Résumé
        self.log("\n" + "=" * 60)
        self.log("📊 RÉSUMÉ DES CORRECTIONS")
        self.log("=" * 60)
        
        for name, success in results.items():
            status = "✅" if success else "❌"
            self.log(f"{status} {name}")
        
        all_success = all(results.values())
        if all_success:
            self.log("\n✅ Toutes les corrections ont réussi!")
        else:
            self.log("\n⚠️ Certaines corrections ont échoué")
        
        return all_success

def main():
    """Point d'entrée principal"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Correction automatique des problèmes API")
    parser.add_argument("--url", default=BASE_URL, help="URL de base de l'API")
    
    args = parser.parse_args()
    
    fixer = APIFixer(base_url=args.url)
    
    try:
        success = fixer.fix_all()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️ Correction interrompue par l'utilisateur")
        sys.exit(130)
    except Exception as e:
        print(f"\n\n❌ Erreur fatale: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()

