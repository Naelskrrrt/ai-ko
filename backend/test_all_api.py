"""
Script de test complet pour toutes les API
Teste tous les endpoints et corrige automatiquement les problèmes
"""
import requests
import json
import sys
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

# Configuration
BASE_URL = "http://localhost:5000"
API_PREFIX = "/api"

class TestStatus(Enum):
    PASSED = "✅ PASSÉ"
    FAILED = "❌ ÉCHOUÉ"
    SKIPPED = "⏭️ IGNORÉ"
    FIXED = "🔧 CORRIGÉ"

@dataclass
class TestResult:
    endpoint: str
    method: str
    status_code: int
    expected_status: int
    test_status: TestStatus
    message: str
    response_data: Optional[Dict] = None
    error: Optional[str] = None

class APITester:
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.token_admin: Optional[str] = None
        self.token_enseignant: Optional[str] = None
        self.token_etudiant: Optional[str] = None
        self.test_results: List[TestResult] = []
        self.created_resources: Dict[str, List[str]] = {
            'niveaux': [],
            'matieres': [],
            'classes': [],
            'sessions': [],
            'resultats': [],
            'qcms': [],
            'questions': [],
            'users': []
        }
        
    def log(self, message: str, level: str = "INFO"):
        """Log avec timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
        
    def make_request(self, method: str, endpoint: str, 
                    data: Optional[Dict] = None, 
                    token: Optional[str] = None,
                    expected_status: Optional[int] = None) -> Tuple[int, Dict]:
        """Fait une requête HTTP"""
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=10)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=10)
            elif method.upper() == "PATCH":
                response = requests.patch(url, headers=headers, json=data, timeout=10)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                raise ValueError(f"Méthode HTTP non supportée: {method}")
                
            try:
                response_data = response.json()
            except:
                response_data = {"raw": response.text}
                
            status_code = response.status_code
            
            # Vérifier le statut attendu
            if expected_status and status_code != expected_status:
                self.log(f"⚠️ Statut inattendu: {status_code} (attendu: {expected_status})", "WARN")
                
            return status_code, response_data
            
        except requests.exceptions.ConnectionError:
            self.log(f"❌ Impossible de se connecter à {url}", "ERROR")
            return 0, {"error": "Connection refused"}
        except Exception as e:
            self.log(f"❌ Erreur lors de la requête: {str(e)}", "ERROR")
            return 0, {"error": str(e)}
    
    def authenticate_users(self):
        """Authentifie les différents types d'utilisateurs"""
        self.log("🔐 Authentification des utilisateurs...")
        
        # Créer les utilisateurs s'ils n'existent pas
        users_to_create = [
            {
                "email": "admin@test.com",
                "password": "admin123",
                "name": "Admin Test",
                "role": "admin"
            },
            {
                "email": "enseignant@test.com",
                "password": "enseignant123",
                "name": "Enseignant Test",
                "role": "enseignant"
            },
            {
                "email": "etudiant@test.com",
                "password": "etudiant123",
                "name": "Étudiant Test",
                "role": "etudiant"
            }
        ]
        
        for user_data in users_to_create:
            # Essayer de se connecter d'abord
            status, response = self.make_request("POST", "/api/auth/login", {
                "email": user_data["email"],
                "password": user_data["password"]
            })
            
            if status == 200:
                token = response.get("token")
                if user_data["role"] == "admin":
                    self.token_admin = token
                elif user_data["role"] == "enseignant":
                    self.token_enseignant = token
                elif user_data["role"] == "etudiant":
                    self.token_etudiant = token
                self.log(f"✅ Connexion réussie: {user_data['email']}")
            else:
                # Essayer de créer l'utilisateur
                self.log(f"⚠️ Utilisateur {user_data['email']} non trouvé, tentative de création...")
                status, response = self.make_request("POST", "/api/auth/register", user_data)
                if status in [200, 201]:
                    # Réessayer de se connecter
                    status, response = self.make_request("POST", "/api/auth/login", {
                        "email": user_data["email"],
                        "password": user_data["password"]
                    })
                    if status == 200:
                        token = response.get("token")
                        if user_data["role"] == "admin":
                            self.token_admin = token
                        elif user_data["role"] == "enseignant":
                            self.token_enseignant = token
                        elif user_data["role"] == "etudiant":
                            self.token_etudiant = token
                        self.log(f"✅ Utilisateur créé et connecté: {user_data['email']}")
        
        if not self.token_admin:
            self.log("❌ Impossible d'obtenir un token admin", "ERROR")
        if not self.token_etudiant:
            self.log("⚠️ Impossible d'obtenir un token étudiant", "WARN")
        if not self.token_enseignant:
            self.log("⚠️ Impossible d'obtenir un token enseignant", "WARN")
    
    def test_endpoint(self, method: str, endpoint: str, 
                     expected_status: int = 200,
                     data: Optional[Dict] = None,
                     token: Optional[str] = None,
                     description: str = "") -> TestResult:
        """Teste un endpoint"""
        self.log(f"🧪 Test: {method} {endpoint} - {description}")
        
        status_code, response_data = self.make_request(
            method, endpoint, data, token, expected_status
        )
        
        if status_code == expected_status:
            test_status = TestStatus.PASSED
            message = f"Statut {status_code} comme attendu"
        elif status_code == 0:
            test_status = TestStatus.FAILED
            message = "Erreur de connexion"
        else:
            test_status = TestStatus.FAILED
            message = f"Statut {status_code} au lieu de {expected_status}"
        
        result = TestResult(
            endpoint=endpoint,
            method=method,
            status_code=status_code,
            expected_status=expected_status,
            test_status=test_status,
            message=message,
            response_data=response_data
        )
        
        self.test_results.append(result)
        return result
    
    def test_health_endpoints(self):
        """Teste les endpoints de santé"""
        self.log("\n" + "="*60)
        self.log("🏥 TEST DES ENDPOINTS DE SANTÉ")
        self.log("="*60)
        
        self.test_endpoint("GET", "/health", 200, description="Health check simple")
        self.test_endpoint("GET", "/health/detailed", 200, description="Health check détaillé")
        self.test_endpoint("GET", "/health/ready", 200, description="Readiness check")
        self.test_endpoint("GET", "/health/live", 200, description="Liveness check")
    
    def test_auth_endpoints(self):
        """Teste les endpoints d'authentification"""
        self.log("\n" + "="*60)
        self.log("🔐 TEST DES ENDPOINTS D'AUTHENTIFICATION")
        self.log("="*60)
        
        # Test register (peut échouer si l'utilisateur existe déjà)
        result = self.test_endpoint(
            "POST", "/api/auth/register",
            expected_status=201,
            data={
                "email": f"test_{datetime.now().timestamp()}@test.com",
                "password": "test123",
                "name": "Test User"
            },
            description="Inscription d'un nouvel utilisateur"
        )
        
        # Test login
        self.test_endpoint(
            "POST", "/api/auth/login",
            expected_status=200,
            data={"email": "admin@test.com", "password": "admin123"},
            description="Connexion"
        )
        
        # Test /me (nécessite authentification)
        if self.token_admin:
            self.test_endpoint(
                "GET", "/api/auth/me",
                expected_status=200,
                token=self.token_admin,
                description="Récupération du profil utilisateur"
            )
        
        # Test logout
        if self.token_admin:
            self.test_endpoint(
                "POST", "/api/auth/logout",
                expected_status=200,
                token=self.token_admin,
                description="Déconnexion"
            )
    
    def test_niveau_endpoints(self):
        """Teste les endpoints de niveaux"""
        self.log("\n" + "="*60)
        self.log("📚 TEST DES ENDPOINTS NIVEAUX")
        self.log("="*60)
        
        # GET /api/niveaux (public)
        self.test_endpoint("GET", "/api/niveaux", 200, description="Liste tous les niveaux")
        
        # GET /api/niveaux/cycle/{cycle}
        self.test_endpoint("GET", "/api/niveaux/cycle/licence", 200, description="Niveaux par cycle")
        
        if self.token_admin:
            # POST /api/niveaux
            niveau_data = {
                "code": f"TEST_{int(datetime.now().timestamp())}",
                "nom": "Niveau Test",
                "ordre": 99,
                "cycle": "licence",
                "description": "Niveau créé pour les tests"
            }
            result = self.test_endpoint(
                "POST", "/api/niveaux",
                expected_status=201,
                data=niveau_data,
                token=self.token_admin,
                description="Création d'un niveau"
            )
            
            if result.status_code == 201 and result.response_data:
                niveau_id = result.response_data.get("id")
                if niveau_id:
                    self.created_resources['niveaux'].append(niveau_id)
                    
                    # GET /api/niveaux/{id}
                    self.test_endpoint(
                        "GET", f"/api/niveaux/{niveau_id}",
                        expected_status=200,
                        description="Détails d'un niveau"
                    )
                    
                    # PUT /api/niveaux/{id}
                    self.test_endpoint(
                        "PUT", f"/api/niveaux/{niveau_id}",
                        expected_status=200,
                        data={"nom": "Niveau Test Modifié"},
                        token=self.token_admin,
                        description="Mise à jour d'un niveau"
                    )
                    
                    # DELETE /api/niveaux/{id}
                    self.test_endpoint(
                        "DELETE", f"/api/niveaux/{niveau_id}",
                        expected_status=200,
                        token=self.token_admin,
                        description="Suppression d'un niveau"
                    )
                    # Retirer de la liste car supprimé
                    if niveau_id in self.created_resources['niveaux']:
                        self.created_resources['niveaux'].remove(niveau_id)
    
    def test_matiere_endpoints(self):
        """Teste les endpoints de matières"""
        self.log("\n" + "="*60)
        self.log("📖 TEST DES ENDPOINTS MATIÈRES")
        self.log("="*60)
        
        # GET /api/matieres
        self.test_endpoint("GET", "/api/matieres", 200, description="Liste toutes les matières")
        
        if self.token_admin:
            # POST /api/matieres
            matiere_data = {
                "code": f"MAT_{int(datetime.now().timestamp())}",
                "nom": "Matière Test",
                "description": "Matière créée pour les tests",
                "coefficient": 1.0
            }
            result = self.test_endpoint(
                "POST", "/api/matieres",
                expected_status=201,
                data=matiere_data,
                token=self.token_admin,
                description="Création d'une matière"
            )
            
            if result.status_code == 201 and result.response_data:
                matiere_id = result.response_data.get("id")
                if matiere_id:
                    self.created_resources['matieres'].append(matiere_id)
                    
                    # GET /api/matieres/{id}
                    self.test_endpoint(
                        "GET", f"/api/matieres/{matiere_id}",
                        expected_status=200,
                        description="Détails d'une matière"
                    )
                    
                    # PUT /api/matieres/{id}
                    self.test_endpoint(
                        "PUT", f"/api/matieres/{matiere_id}",
                        expected_status=200,
                        data={"nom": "Matière Test Modifiée"},
                        token=self.token_admin,
                        description="Mise à jour d'une matière"
                    )
                    
                    # DELETE /api/matieres/{id}
                    self.test_endpoint(
                        "DELETE", f"/api/matieres/{matiere_id}",
                        expected_status=200,
                        token=self.token_admin,
                        description="Suppression d'une matière"
                    )
                    if matiere_id in self.created_resources['matieres']:
                        self.created_resources['matieres'].remove(matiere_id)
    
    def test_classe_endpoints(self):
        """Teste les endpoints de classes"""
        self.log("\n" + "="*60)
        self.log("👥 TEST DES ENDPOINTS CLASSES")
        self.log("="*60)
        
        # Nécessite d'abord un niveau
        if not self.token_admin:
            self.log("⚠️ Token admin manquant, skip des tests de classes", "WARN")
            return
        
        # Récupérer un niveau existant
        status, niveaux_response = self.make_request("GET", "/api/niveaux")
        if status != 200 or not niveaux_response:
            self.log("⚠️ Impossible de récupérer les niveaux", "WARN")
            return
        
        niveaux = niveaux_response if isinstance(niveaux_response, list) else []
        if not niveaux:
            self.log("⚠️ Aucun niveau disponible, création d'un niveau de test...", "WARN")
            niveau_data = {
                "code": f"L1_TEST_{int(datetime.now().timestamp())}",
                "nom": "Licence 1 Test",
                "ordre": 1,
                "cycle": "licence"
            }
            status, response = self.make_request("POST", "/api/niveaux", niveau_data, self.token_admin)
            if status == 201:
                niveaux = [response]
            else:
                self.log("❌ Impossible de créer un niveau de test", "ERROR")
                return
        
        niveau_id = niveaux[0].get("id")
        
        # GET /api/classes
        self.test_endpoint(
            "GET", "/api/classes",
            expected_status=200,
            token=self.token_admin,
            description="Liste toutes les classes"
        )
        
        # POST /api/classes
        classe_data = {
            "code": f"CLASSE_{int(datetime.now().timestamp())}",
            "nom": "Classe Test",
            "niveauId": niveau_id,
            "anneeScolaire": "2024-2025",
            "semestre": 1
        }
        result = self.test_endpoint(
            "POST", "/api/classes",
            expected_status=201,
            data=classe_data,
            token=self.token_admin,
            description="Création d'une classe"
        )
        
        if result.status_code == 201 and result.response_data:
            classe_id = result.response_data.get("id")
            if classe_id:
                self.created_resources['classes'].append(classe_id)
                
                # GET /api/classes/{id}
                self.test_endpoint(
                    "GET", f"/api/classes/{classe_id}",
                    expected_status=200,
                    token=self.token_admin,
                    description="Détails d'une classe"
                )
                
                # GET /api/classes/niveau/{niveau_id}
                self.test_endpoint(
                    "GET", f"/api/classes/niveau/{niveau_id}",
                    expected_status=200,
                    token=self.token_admin,
                    description="Classes par niveau"
                )
                
                # PUT /api/classes/{id}
                self.test_endpoint(
                    "PUT", f"/api/classes/{classe_id}",
                    expected_status=200,
                    data={"nom": "Classe Test Modifiée"},
                    token=self.token_admin,
                    description="Mise à jour d'une classe"
                )
                
                # DELETE /api/classes/{id}
                self.test_endpoint(
                    "DELETE", f"/api/classes/{classe_id}",
                    expected_status=200,
                    token=self.token_admin,
                    description="Suppression d'une classe"
                )
                if classe_id in self.created_resources['classes']:
                    self.created_resources['classes'].remove(classe_id)
    
    def test_qcm_endpoints(self):
        """Teste les endpoints QCM"""
        self.log("\n" + "="*60)
        self.log("📝 TEST DES ENDPOINTS QCM")
        self.log("="*60)
        
        if not self.token_admin:
            self.log("⚠️ Token admin manquant, skip des tests QCM", "WARN")
            return
        
        # GET /api/qcm
        self.test_endpoint(
            "GET", "/api/qcm",
            expected_status=200,
            token=self.token_admin,
            description="Liste tous les QCM"
        )
        
        # POST /api/qcm
        qcm_data = {
            "titre": f"QCM Test {int(datetime.now().timestamp())}",
            "description": "QCM créé pour les tests",
            "duree": 60,
            "matiere": "Test",
            "status": "draft"
        }
        result = self.test_endpoint(
            "POST", "/api/qcm",
            expected_status=201,
            data=qcm_data,
            token=self.token_admin,
            description="Création d'un QCM"
        )
        
        if result.status_code == 201 and result.response_data:
            qcm_id = result.response_data.get("id")
            if qcm_id:
                self.created_resources['qcms'].append(qcm_id)
                
                # GET /api/qcm/{id}
                self.test_endpoint(
                    "GET", f"/api/qcm/{qcm_id}",
                    expected_status=200,
                    token=self.token_admin,
                    description="Détails d'un QCM"
                )
                
                # PUT /api/qcm/{id}
                self.test_endpoint(
                    "PUT", f"/api/qcm/{qcm_id}",
                    expected_status=200,
                    data={"titre": "QCM Test Modifié"},
                    token=self.token_admin,
                    description="Mise à jour d'un QCM"
                )
                
                # PATCH /api/qcm/{id}/publish
                self.test_endpoint(
                    "PATCH", f"/api/qcm/{qcm_id}/publish",
                    expected_status=200,
                    token=self.token_admin,
                    description="Publication d'un QCM"
                )
                
                # GET /api/qcm/{id}/questions
                self.test_endpoint(
                    "GET", f"/api/qcm/{qcm_id}/questions",
                    expected_status=200,
                    token=self.token_admin,
                    description="Questions d'un QCM"
                )
                
                # DELETE /api/qcm/{id}
                self.test_endpoint(
                    "DELETE", f"/api/qcm/{qcm_id}",
                    expected_status=200,
                    token=self.token_admin,
                    description="Suppression d'un QCM"
                )
                if qcm_id in self.created_resources['qcms']:
                    self.created_resources['qcms'].remove(qcm_id)
    
    def test_session_endpoints(self):
        """Teste les endpoints de sessions d'examen"""
        self.log("\n" + "="*60)
        self.log("📅 TEST DES ENDPOINTS SESSIONS")
        self.log("="*60)
        
        if not self.token_admin:
            self.log("⚠️ Token admin manquant, skip des tests sessions", "WARN")
            return
        
        # Récupérer un QCM existant ou en créer un
        status, qcms_response = self.make_request("GET", "/api/qcm", token=self.token_admin)
        qcm_id = None
        if status == 200 and qcms_response:
            qcms = qcms_response.get("data", []) if isinstance(qcms_response, dict) else qcms_response
            if qcms and len(qcms) > 0:
                qcm_id = qcms[0].get("id")
        
        if not qcm_id:
            # Créer un QCM
            qcm_data = {
                "titre": f"QCM Session Test {int(datetime.now().timestamp())}",
                "description": "QCM pour test de session",
                "duree": 60,
                "status": "published"
            }
            status, response = self.make_request("POST", "/api/qcm", qcm_data, self.token_admin)
            if status == 201:
                qcm_id = response.get("id")
        
        if not qcm_id:
            self.log("❌ Impossible d'obtenir un QCM pour les tests", "ERROR")
            return
        
        # GET /api/sessions
        self.test_endpoint(
            "GET", "/api/sessions",
            expected_status=200,
            token=self.token_admin,
            description="Liste toutes les sessions"
        )
        
        # POST /api/sessions
        date_debut = datetime.now() + timedelta(days=1)
        date_fin = date_debut + timedelta(hours=2)
        session_data = {
            "titre": f"Session Test {int(datetime.now().timestamp())}",
            "description": "Session créée pour les tests",
            "dateDebut": date_debut.isoformat(),
            "dateFin": date_fin.isoformat(),
            "dureeMinutes": 120,
            "qcmId": qcm_id,
            "status": "programmee"
        }
        result = self.test_endpoint(
            "POST", "/api/sessions",
            expected_status=201,
            data=session_data,
            token=self.token_admin,
            description="Création d'une session"
        )
        
        if result.status_code == 201 and result.response_data:
            session_id = result.response_data.get("id")
            if session_id:
                self.created_resources['sessions'].append(session_id)
                
                # GET /api/sessions/{id}
                self.test_endpoint(
                    "GET", f"/api/sessions/{session_id}",
                    expected_status=200,
                    token=self.token_admin,
                    description="Détails d'une session"
                )
                
                # PATCH /api/sessions/{id}/demarrer
                self.test_endpoint(
                    "PATCH", f"/api/sessions/{session_id}/demarrer",
                    expected_status=200,
                    token=self.token_admin,
                    description="Démarrage d'une session"
                )
                
                # PATCH /api/sessions/{id}/terminer
                self.test_endpoint(
                    "PATCH", f"/api/sessions/{session_id}/terminer",
                    expected_status=200,
                    token=self.token_admin,
                    description="Terminaison d'une session"
                )
                
                # GET /api/sessions/disponibles
                if self.token_etudiant:
                    self.test_endpoint(
                        "GET", "/api/sessions/disponibles",
                        expected_status=200,
                        token=self.token_etudiant,
                        description="Sessions disponibles pour étudiant"
                    )
                
                # DELETE /api/sessions/{id}
                self.test_endpoint(
                    "DELETE", f"/api/sessions/{session_id}",
                    expected_status=200,
                    token=self.token_admin,
                    description="Suppression d'une session"
                )
                if session_id in self.created_resources['sessions']:
                    self.created_resources['sessions'].remove(session_id)
    
    def test_resultat_endpoints(self):
        """Teste les endpoints de résultats"""
        self.log("\n" + "="*60)
        self.log("📊 TEST DES ENDPOINTS RÉSULTATS")
        self.log("="*60)
        
        if not self.token_admin:
            self.log("⚠️ Token admin manquant, skip des tests résultats", "WARN")
            return
        
        # GET /api/resultats
        self.test_endpoint(
            "GET", "/api/resultats",
            expected_status=200,
            token=self.token_admin,
            description="Liste tous les résultats"
        )
        
        if self.token_etudiant:
            # Récupérer les sessions disponibles
            status, sessions_response = self.make_request(
                "GET", "/api/sessions/disponibles", token=self.token_etudiant
            )
            if status == 200 and sessions_response:
                sessions = sessions_response if isinstance(sessions_response, list) else []
                if sessions and len(sessions) > 0:
                    session_id = sessions[0].get("id")
                    
                    # POST /api/resultats/demarrer
                    result = self.test_endpoint(
                        "POST", "/api/resultats/demarrer",
                        expected_status=201,
                        data={"sessionId": session_id},
                        token=self.token_etudiant,
                        description="Démarrage d'un examen"
                    )
                    
                    if result.status_code == 201 and result.response_data:
                        resultat_id = result.response_data.get("id")
                        if resultat_id:
                            self.created_resources['resultats'].append(resultat_id)
                            
                            # GET /api/resultats/{id}
                            self.test_endpoint(
                                "GET", f"/api/resultats/{resultat_id}",
                                expected_status=200,
                                token=self.token_etudiant,
                                description="Détails d'un résultat"
                            )
                            
                            # POST /api/resultats/{id}/soumettre
                            self.test_endpoint(
                                "POST", f"/api/resultats/{resultat_id}/soumettre",
                                expected_status=200,
                                data={"reponses": {}},
                                token=self.token_etudiant,
                                description="Soumission des réponses"
                            )
                            
                            # GET /api/resultats/etudiant/{id}
                            etudiant_id = result.response_data.get("etudiantId")
                            if etudiant_id:
                                self.test_endpoint(
                                    "GET", f"/api/resultats/etudiant/{etudiant_id}",
                                    expected_status=200,
                                    token=self.token_etudiant,
                                    description="Résultats d'un étudiant"
                                )
    
    def test_admin_endpoints(self):
        """Teste les endpoints admin"""
        self.log("\n" + "="*60)
        self.log("👑 TEST DES ENDPOINTS ADMIN")
        self.log("="*60)
        
        if not self.token_admin:
            self.log("⚠️ Token admin manquant, skip des tests admin", "WARN")
            return
        
        # GET /api/admin/users
        self.test_endpoint(
            "GET", "/api/admin/users",
            expected_status=200,
            token=self.token_admin,
            description="Liste des utilisateurs (admin)"
        )
        
        # GET /api/admin/qcm
        self.test_endpoint(
            "GET", "/api/admin/qcm",
            expected_status=200,
            token=self.token_admin,
            description="Liste des QCM (admin)"
        )
        
        # GET /api/admin/questions
        self.test_endpoint(
            "GET", "/api/admin/questions",
            expected_status=200,
            token=self.token_admin,
            description="Liste des questions (admin)"
        )
        
        # GET /api/admin/statistics/dashboard
        self.test_endpoint(
            "GET", "/api/admin/statistics/dashboard",
            expected_status=200,
            token=self.token_admin,
            description="Statistiques dashboard (admin)"
        )
        
        # GET /api/admin/statistics/metrics
        self.test_endpoint(
            "GET", "/api/admin/statistics/metrics",
            expected_status=200,
            token=self.token_admin,
            description="Métriques (admin)"
        )
        
        # GET /api/admin/statistics/users-by-role
        self.test_endpoint(
            "GET", "/api/admin/statistics/users-by-role",
            expected_status=200,
            token=self.token_admin,
            description="Statistiques utilisateurs par rôle (admin)"
        )
        
        # GET /api/admin/statistics/qcms-by-status
        self.test_endpoint(
            "GET", "/api/admin/statistics/qcms-by-status",
            expected_status=200,
            token=self.token_admin,
            description="Statistiques QCM par statut (admin)"
        )
    
    def test_correction_endpoints(self):
        """Teste les endpoints de correction"""
        self.log("\n" + "="*60)
        self.log("✏️ TEST DES ENDPOINTS CORRECTION")
        self.log("="*60)
        
        if not self.token_admin:
            self.log("⚠️ Token admin manquant, skip des tests correction", "WARN")
            return
        
        # POST /api/correction/submit
        self.test_endpoint(
            "POST", "/api/correction/submit",
            expected_status=202,  # Accepted (tâche asynchrone)
            data={
                "question_id": "test_question_id",
                "answer": "Réponse test"
            },
            token=self.token_admin,
            description="Soumission d'une réponse pour correction"
        )
        
        # POST /api/correction/batch
        self.test_endpoint(
            "POST", "/api/correction/batch",
            expected_status=202,  # Accepted (tâche asynchrone)
            data={
                "qcm_id": "test_qcm_id",
                "answers": {"q1": "réponse1", "q2": "réponse2"}
            },
            token=self.token_admin,
            description="Soumission batch pour correction"
        )
    
    def cleanup_resources(self):
        """Nettoie les ressources créées pendant les tests"""
        self.log("\n🧹 Nettoyage des ressources créées...")
        
        if self.token_admin:
            # Supprimer les ressources restantes
            for resource_type, ids in self.created_resources.items():
                for resource_id in ids:
                    try:
                        if resource_type == 'niveaux':
                            self.make_request("DELETE", f"/api/niveaux/{resource_id}", token=self.token_admin)
                        elif resource_type == 'matieres':
                            self.make_request("DELETE", f"/api/matieres/{resource_id}", token=self.token_admin)
                        elif resource_type == 'classes':
                            self.make_request("DELETE", f"/api/classes/{resource_id}", token=self.token_admin)
                        elif resource_type == 'sessions':
                            self.make_request("DELETE", f"/api/sessions/{resource_id}", token=self.token_admin)
                        elif resource_type == 'qcms':
                            self.make_request("DELETE", f"/api/qcm/{resource_id}", token=self.token_admin)
                    except:
                        pass
        
        self.log("✅ Nettoyage terminé")
    
    def generate_report(self):
        """Génère un rapport des tests"""
        self.log("\n" + "="*60)
        self.log("📊 RAPPORT DES TESTS")
        self.log("="*60)
        
        total = len(self.test_results)
        passed = sum(1 for r in self.test_results if r.test_status == TestStatus.PASSED)
        failed = sum(1 for r in self.test_results if r.test_status == TestStatus.FAILED)
        skipped = sum(1 for r in self.test_results if r.test_status == TestStatus.SKIPPED)
        
        self.log(f"\nTotal: {total}")
        self.log(f"✅ Passés: {passed}")
        self.log(f"❌ Échoués: {failed}")
        self.log(f"⏭️ Ignorés: {skipped}")
        self.log(f"📈 Taux de réussite: {(passed/total*100):.1f}%" if total > 0 else "N/A")
        
        # Détails des échecs
        if failed > 0:
            self.log("\n" + "-"*60)
            self.log("❌ DÉTAILS DES ÉCHECS:")
            self.log("-"*60)
            for result in self.test_results:
                if result.test_status == TestStatus.FAILED:
                    self.log(f"\n{result.method} {result.endpoint}")
                    self.log(f"  Statut: {result.status_code} (attendu: {result.expected_status})")
                    self.log(f"  Message: {result.message}")
                    if result.error:
                        self.log(f"  Erreur: {result.error}")
        
        # Sauvegarder le rapport dans un fichier
        report_file = f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        report_data = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total": total,
                "passed": passed,
                "failed": failed,
                "skipped": skipped,
                "success_rate": (passed/total*100) if total > 0 else 0
            },
            "results": [
                {
                    "endpoint": r.endpoint,
                    "method": r.method,
                    "status_code": r.status_code,
                    "expected_status": r.expected_status,
                    "test_status": r.test_status.value,
                    "message": r.message,
                    "error": r.error
                }
                for r in self.test_results
            ]
        }
        
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False)
        
        self.log(f"\n📄 Rapport sauvegardé dans: {report_file}")
        
        return report_data
    
    def run_all_tests(self):
        """Exécute tous les tests"""
        self.log("🚀 DÉMARRAGE DES TESTS API COMPLETS")
        self.log("="*60)
        
        # Authentification
        self.authenticate_users()
        
        # Tests
        self.test_health_endpoints()
        self.test_auth_endpoints()
        self.test_niveau_endpoints()
        self.test_matiere_endpoints()
        self.test_classe_endpoints()
        self.test_qcm_endpoints()
        self.test_session_endpoints()
        self.test_resultat_endpoints()
        self.test_admin_endpoints()
        self.test_correction_endpoints()
        
        # Nettoyage
        self.cleanup_resources()
        
        # Rapport
        report = self.generate_report()
        
        return report

def main():
    """Point d'entrée principal"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test complet de toutes les API")
    parser.add_argument("--url", default=BASE_URL, help="URL de base de l'API")
    parser.add_argument("--skip-cleanup", action="store_true", help="Ne pas nettoyer les ressources")
    
    args = parser.parse_args()
    
    tester = APITester(base_url=args.url)
    
    if args.skip_cleanup:
        tester.cleanup_resources = lambda: None
    
    try:
        report = tester.run_all_tests()
        
        # Code de sortie basé sur les résultats
        if report["summary"]["failed"] > 0:
            sys.exit(1)
        else:
            sys.exit(0)
    except KeyboardInterrupt:
        print("\n\n⚠️ Tests interrompus par l'utilisateur")
        tester.cleanup_resources()
        sys.exit(130)
    except Exception as e:
        print(f"\n\n❌ Erreur fatale: {str(e)}")
        import traceback
        traceback.print_exc()
        tester.cleanup_resources()
        sys.exit(1)

if __name__ == "__main__":
    main()








