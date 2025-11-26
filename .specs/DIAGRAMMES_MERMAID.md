# 📐 Diagrammes Mermaid Complémentaires - Modélisation Système

**Document:** Diagrammes UML et schémas techniques  
**Date:** Novembre 2025  
**Format:** Mermaid

---

## 1. Diagrammes de Cas d'Utilisation

### 1.1 Cas d'Utilisation Enseignant

```mermaid
graph TB
    E[Enseignant]
    
    subgraph "Gestion QCM"
        UC1[Créer QCM manuellement]
        UC2[Générer QCM avec IA]
        UC3[Modifier QCM existant]
        UC4[Supprimer QCM]
        UC5[Publier/Dépublier QCM]
    end
    
    subgraph "Gestion Documents"
        UC6[Uploader document PDF/DOCX]
        UC7[Générer QCM depuis document]
        UC8[Consulter documents]
    end
    
    subgraph "Correction & Évaluation"
        UC9[Consulter résultats étudiants]
        UC10[Corriger manuellement réponses ouvertes]
        UC11[Exporter résultats PDF]
        UC12[Voir statistiques classe]
    end
    
    subgraph "Gestion Étudiants"
        UC13[Voir liste étudiants]
        UC14[Assigner QCM à groupe]
        UC15[Envoyer notifications]
    end
    
    E --> UC1
    E --> UC2
    E --> UC3
    E --> UC4
    E --> UC5
    E --> UC6
    E --> UC7
    E --> UC8
    E --> UC9
    E --> UC10
    E --> UC11
    E --> UC12
    E --> UC13
    E --> UC14
    E --> UC15
    
    UC2 -.utilise.-> UC6
    UC7 -.utilise.-> UC6
    UC11 -.utilise.-> UC9
```

### 1.2 Cas d'Utilisation Étudiant

```mermaid
graph TB
    ET[Étudiant]
    
    subgraph "Examens"
        UC1[Voir examens disponibles]
        UC2[Passer un examen]
        UC3[Soumettre réponses]
        UC4[Voir résultat immédiat]
    end
    
    subgraph "Résultats & Progression"
        UC5[Consulter historique résultats]
        UC6[Voir feedback détaillé]
        UC7[Voir statistiques personnelles]
        UC8[Comparer avec moyenne classe]
    end
    
    subgraph "Révision"
        UC9[Réviser QCM passés]
        UC10[Voir corrections détaillées]
        UC11[Accéder recommandations]
    end
    
    ET --> UC1
    ET --> UC2
    ET --> UC3
    ET --> UC4
    ET --> UC5
    ET --> UC6
    ET --> UC7
    ET --> UC8
    ET --> UC9
    ET --> UC10
    ET --> UC11
    
    UC2 --> UC3
    UC3 --> UC4
    UC4 -.inclut.-> UC6
```

### 1.3 Cas d'Utilisation Administrateur

```mermaid
graph TB
    A[Administrateur]
    
    subgraph "Gestion Utilisateurs"
        UC1[Créer utilisateur]
        UC2[Modifier utilisateur]
        UC3[Supprimer utilisateur]
        UC4[Réinitialiser mot de passe]
        UC5[Gérer rôles/permissions]
    end
    
    subgraph "Gestion Système"
        UC6[Configurer paramètres]
        UC7[Gérer matières/niveaux]
        UC8[Voir logs système]
        UC9[Gérer backups]
    end
    
    subgraph "Statistiques Globales"
        UC10[Tableau de bord général]
        UC11[Rapports d'utilisation]
        UC12[Métriques performance]
    end
    
    A --> UC1
    A --> UC2
    A --> UC3
    A --> UC4
    A --> UC5
    A --> UC6
    A --> UC7
    A --> UC8
    A --> UC9
    A --> UC10
    A --> UC11
    A --> UC12
```

---

## 2. Diagrammes de Séquence Détaillés

### 2.1 Génération QCM avec IA (Flux Complet)

```mermaid
sequenceDiagram
    actor E as Enseignant
    participant F as Frontend Next.js
    participant API as Flask API
    participant Q as Redis Queue
    participant W as Celery Worker
    participant HF as Hugging Face
    participant DB as PostgreSQL
    participant WS as WebSocket
    
    E->>F: Upload document + paramètres
    F->>API: POST /api/qcm/generate-async
    API->>API: Valider fichier (type, taille)
    API->>API: Extraire texte (PyPDF2)
    API->>Q: Enqueue task
    Q-->>API: task_id
    API-->>F: 202 Accepted {task_id}
    F-->>E: "Génération en cours..."
    
    Note over F,E: Polling status toutes les 5s
    
    Q->>W: Dequeue task
    W->>HF: Tokenize texte
    HF-->>W: Tokens
    W->>HF: Generate questions (T5 model)
    
    Note over W,HF: Peut prendre 2-5 min
    
    HF-->>W: Questions brutes
    W->>W: Parse et valider questions
    W->>W: Générer distracteurs
    W->>DB: INSERT QCM + Questions
    DB-->>W: qcm_id
    W->>Q: Update task status: "completed"
    W->>WS: emit('qcm_generated', {qcm_id})
    
    WS-->>F: Notification temps réel
    F-->>E: "QCM généré avec succès!"
    
    E->>F: Cliquer "Voir QCM"
    F->>API: GET /api/qcm/{qcm_id}
    API->>DB: SELECT qcm with questions
    DB-->>API: QCM data
    API-->>F: 200 OK {qcm}
    F-->>E: Affichage QCM avec preview
    
    E->>F: Éditer questions
    F->>API: PUT /api/qcm/{qcm_id}
    API->>DB: UPDATE qcm
    DB-->>API: OK
    API-->>F: 200 OK
    
    E->>F: Publier QCM
    F->>API: PATCH /api/qcm/{qcm_id}/publish
    API->>DB: UPDATE status = 'actif'
    API->>WS: emit('new_exam', étudiants)
    WS-->>F: Notification étudiants
```

### 2.2 Passage d'Examen et Correction

```mermaid
sequenceDiagram
    actor ET as Étudiant
    participant F as Frontend
    participant API as Flask API
    participant CS as Correction Service
    participant HF as HuggingFace
    participant DB as PostgreSQL
    
    ET->>F: Accéder page examen
    F->>API: GET /api/qcm/{id}/start
    API->>DB: Check eligibility
    DB-->>API: QCM + Questions
    API->>DB: CREATE resultat (status='en_cours')
    DB-->>API: resultat_id
    API-->>F: 200 OK {qcm, resultat_id, timer}
    F-->>ET: Afficher examen + timer
    
    loop Pour chaque question
        ET->>F: Sélectionner réponse
        F->>F: Sauvegarder localement
    end
    
    Note over F,ET: Timer expire ou soumission manuelle
    
    ET->>F: Soumettre examen
    F->>API: POST /api/correction/submit
    Note over API: Body: {resultat_id, reponses[]}
    
    API->>CS: Corriger réponses
    
    par Correction QCM (parallèle)
        CS->>CS: Compare réponses exactes
    and Correction ouvertes (parallèle)
        CS->>HF: Embeddings réponse attendue
        HF-->>CS: Vector expected
        CS->>HF: Embeddings réponse étudiant
        HF-->>CS: Vector student
        CS->>CS: Calcul similarité cosinus
        CS->>CS: Score pondéré (sémantique + mots-clés)
    end
    
    CS->>HF: Generate feedback
    HF-->>CS: Feedback personnalisé
    
    CS->>DB: UPDATE resultat + reponses
    DB-->>CS: OK
    CS-->>API: {note, feedback, details}
    
    API-->>F: 200 OK {resultat}
    F-->>ET: Afficher résultats + feedback
    
    opt Export PDF
        ET->>F: Exporter résultats
        F->>API: GET /api/resultats/{id}/export
        API->>API: Generate PDF (jsPDF)
        API-->>F: PDF file
        F-->>ET: Télécharger PDF
    end
```

### 2.3 Authentification avec NextAuth

```mermaid
sequenceDiagram
    actor U as Utilisateur
    participant F as Next.js Frontend
    participant NA as NextAuth API Route
    participant FB as Flask Backend
    participant DB as PostgreSQL
    
    U->>F: Accéder page login
    F-->>U: Formulaire login
    U->>F: Soumettre credentials
    F->>NA: POST /api/auth/signin
    NA->>FB: POST /auth/login
    FB->>DB: SELECT user WHERE username=?
    DB-->>FB: User data
    FB->>FB: Verify password (bcrypt)
    
    alt Password correct
        FB->>FB: Generate JWT token
        FB-->>NA: 200 OK {token, user}
        NA->>NA: Create session
        NA-->>F: Set session cookie
        F->>F: Redirect selon rôle
        F-->>U: Dashboard (enseignant/etudiant/admin)
    else Password incorrect
        FB-->>NA: 401 Unauthorized
        NA-->>F: Error
        F-->>U: Message erreur
    end
    
    Note over F,U: Requêtes suivantes avec session
    
    U->>F: Naviguer vers page protégée
    F->>F: Middleware vérifie session
    
    alt Session valide
        F->>NA: getServerSession()
        NA-->>F: User data
        F-->>U: Render page
    else Session invalide
        F->>F: Redirect /login
    end
```

---

## 3. Diagrammes de Classes (Domain Models)

### 3.1 Modèle de Domaine Complet

```mermaid
classDiagram
    class User {
        +int id
        +string username
        +string email
        +string password_hash
        +enum role
        +string nom
        +string prenom
        +string matricule
        +datetime created_at
        +set_password(password)
        +check_password(password)
        +to_dict()
    }
    
    class NiveauParcours {
        +int id
        +string niveau
        +string parcours
        +string code
        +string description
        +to_dict()
    }
    
    class Matiere {
        +int id
        +string nom
        +string code
        +string description
        +string departement
        +to_dict()
    }
    
    class QCM {
        +int id
        +string titre
        +text description
        +int duree_minutes
        +datetime date_creation
        +datetime date_limite
        +enum statut
        +float note_totale
        +nombre_questions()
        +taux_reussite()
        +to_dict()
    }
    
    class Question {
        +int id
        +text enonce
        +enum type
        +float points
        +int ordre
        +text explication
        +to_dict()
    }
    
    class OptionReponse {
        +int id
        +text texte
        +boolean est_correcte
        +int ordre
        +to_dict()
    }
    
    class Resultat {
        +int id
        +float note_obtenue
        +float note_maximale
        +datetime date_soumission
        +int duree_secondes
        +text feedback_ia
        +pourcentage()
        +to_dict()
    }
    
    class ReponseComposee {
        +int id
        +text reponse_etudiant
        +boolean est_correcte
        +float score_similarite
        +text feedback
        +to_dict()
    }
    
    class Document {
        +int id
        +string titre
        +string nom_fichier
        +string chemin_fichier
        +string type_mime
        +int taille_octets
        +datetime date_upload
        +text contenu_extrait
        +to_dict()
    }
    
    User "1" --> "0..*" QCM : crée
    User "1" --> "0..*" Resultat : obtient
    User "1" --> "0..*" Document : upload
    User "*" --> "1" NiveauParcours : appartient
    
    QCM "1" --> "1..*" Question : contient
    QCM "*" --> "1" Matiere : concerne
    QCM "*" --> "0..1" Document : généré_de
    QCM "1" --> "0..*" Resultat : évalué_par
    
    Question "1" --> "2..6" OptionReponse : possède
    Question "1" --> "0..*" ReponseComposee : reçoit
    
    Resultat "1" --> "1..*" ReponseComposee : contient
    
    <<Entity>> User
    <<Entity>> QCM
    <<Entity>> Question
    <<ValueObject>> OptionReponse
    <<Entity>> Resultat
```

### 3.2 Architecture Services (Backend)

```mermaid
classDiagram
    class BaseRepository~T~ {
        <<abstract>>
        #model: Type[T]
        #session: Session
        +get_by_id(id) T
        +get_all() List[T]
        +create(entity) T
        +update(entity) T
        +delete(entity) bool
    }
    
    class QCMRepository {
        +get_by_enseignant(id) List[QCM]
        +get_actifs() List[QCM]
        +get_with_questions(id) QCM
        +search(query) List[QCM]
    }
    
    class UserRepository {
        +get_by_username(username) User
        +get_by_email(email) User
        +get_by_role(role) List[User]
    }
    
    class ResultatRepository {
        +get_by_etudiant(id) List[Resultat]
        +get_by_qcm(id) List[Resultat]
        +get_statistics(etudiant_id)
    }
    
    class BaseService {
        <<abstract>>
        #repository: BaseRepository
        +validate_data(data)
        +handle_error(exception)
    }
    
    class QCMService {
        -qcm_repository: QCMRepository
        -hf_service: HuggingFaceService
        +create_qcm(data) QCM
        +update_qcm(id, data) QCM
        +generate_from_text(text) QCM
        +publish_qcm(id) QCM
    }
    
    class AuthService {
        -user_repository: UserRepository
        +login(credentials) Token
        +register(user_data) User
        +refresh_token(token) Token
        +logout(token) bool
    }
    
    class CorrectionService {
        -resultat_repository: ResultatRepository
        -hf_service: HuggingFaceService
        +correct_qcm(reponses) Resultat
        +correct_question_ouverte(question, reponse) float
        +generate_feedback(resultat) string
    }
    
    class HuggingFaceService {
        -model_t5: T5Model
        -model_bert: BERTModel
        -tokenizer: Tokenizer
        +generate_questions(text, num) List
        +generate_distractors(question) List
        +get_embeddings(text) Vector
        +calculate_similarity(v1, v2) float
    }
    
    BaseRepository <|-- QCMRepository
    BaseRepository <|-- UserRepository
    BaseRepository <|-- ResultatRepository
    
    BaseService <|-- QCMService
    BaseService <|-- AuthService
    BaseService <|-- CorrectionService
    
    QCMService --> QCMRepository
    QCMService --> HuggingFaceService
    
    AuthService --> UserRepository
    
    CorrectionService --> ResultatRepository
    CorrectionService --> HuggingFaceService
```

---

## 4. Diagrammes d'États

### 4.1 États d'un QCM

```mermaid
stateDiagram-v2
    [*] --> Brouillon: Création
    
    Brouillon --> EnCours: Publication
    Brouillon --> Supprimé: Suppression
    
    EnCours --> Terminé: Date limite atteinte
    EnCours --> Suspendu: Suspension manuelle
    EnCours --> Brouillon: Dépublication
    
    Suspendu --> EnCours: Reprise
    Suspendu --> Terminé: Clôture
    
    Terminé --> Archivé: Archivage
    
    Archivé --> [*]
    Supprimé --> [*]
    
    note right of EnCours
        Étudiants peuvent passer l'examen
        Corrections automatiques actives
    end note
    
    note right of Terminé
        Plus de nouvelles soumissions
        Résultats consultables
    end note
```

### 4.2 États d'un Résultat

```mermaid
stateDiagram-v2
    [*] --> NonCommencé: QCM assigné
    
    NonCommencé --> EnCours: Démarrage examen
    
    EnCours --> Soumis: Soumission manuelle
    EnCours --> Soumis: Timer expiré
    EnCours --> Abandonné: Abandon
    
    Soumis --> EnCorrection: Envoi correction
    
    EnCorrection --> Corrigé: Correction terminée
    
    Corrigé --> Validé: Validation enseignant
    Corrigé --> EnRévision: Contestation étudiant
    
    EnRévision --> Corrigé: Révision refusée
    EnRévision --> Validé: Révision acceptée
    
    Validé --> [*]
    Abandonné --> [*]
    
    note right of EnCorrection
        Correction automatique IA
        Calcul scores
        Génération feedback
    end note
```

### 4.3 Workflow de Génération IA

```mermaid
stateDiagram-v2
    [*] --> Initialisation: Upload document
    
    Initialisation --> Extraction: Validation OK
    Initialisation --> Erreur: Validation KO
    
    Extraction --> Analyse: Texte extrait
    Extraction --> Erreur: Extraction échouée
    
    Analyse --> Génération: Concepts identifiés
    
    Génération --> Validation: Questions générées
    
    Validation --> Finalisation: Questions valides
    Validation --> Génération: Retry (questions invalides)
    
    Finalisation --> Sauvegarde: QCM structuré
    
    Sauvegarde --> Complété: DB insert OK
    Sauvegarde --> Erreur: DB insert échoué
    
    Complété --> [*]
    Erreur --> [*]
    
    note right of Analyse
        NLP pipeline:
        - Tokenization
        - NER
        - Keyword extraction
    end note
    
    note right of Génération
        Modèles IA:
        - T5 pour questions
        - GPT pour distracteurs
        - Validation cohérence
    end note
```

---

## 5. Diagrammes de Déploiement

### 5.1 Architecture de Déploiement AWS

```mermaid
graph TB
    subgraph "Region: eu-west-1"
        subgraph "Availability Zone 1"
            subgraph "Public Subnet 1a"
                ALB1[Load Balancer<br/>Primary]
                NAT1[NAT Gateway]
            end
            
            subgraph "Private Subnet 1a"
                ECS1a[ECS Task<br/>Next.js]
                ECS2a[ECS Task<br/>Flask API]
                ECS3a[ECS Task<br/>Celery Worker]
            end
        end
        
        subgraph "Availability Zone 2"
            subgraph "Public Subnet 1b"
                ALB2[Load Balancer<br/>Standby]
                NAT2[NAT Gateway]
            end
            
            subgraph "Private Subnet 1b"
                ECS1b[ECS Task<br/>Next.js]
                ECS2b[ECS Task<br/>Flask API]
                ECS3b[ECS Task<br/>Celery Worker]
            end
        end
        
        subgraph "Data Tier - Multi-AZ"
            RDS[(RDS PostgreSQL<br/>Primary + Replica)]
            REDIS[(ElastiCache<br/>Redis Cluster)]
        end
        
        subgraph "Storage"
            S3[S3 Bucket<br/>Documents]
            CF[CloudFront CDN]
        end
    end
    
    subgraph "Monitoring"
        CW[CloudWatch]
        XR[X-Ray]
    end
    
    Internet([Internet]) -->|HTTPS| CF
    CF --> ALB1
    CF --> ALB2
    
    ALB1 --> ECS1a
    ALB1 --> ECS2a
    ALB2 --> ECS1b
    ALB2 --> ECS2b
    
    ECS2a --> RDS
    ECS2b --> RDS
    ECS2a --> REDIS
    ECS2b --> REDIS
    ECS2a --> S3
    ECS2b --> S3
    
    ECS3a --> REDIS
    ECS3b --> REDIS
    ECS3a --> RDS
    ECS3b --> RDS
    
    ECS1a --> CW
    ECS2a --> CW
    ECS2a --> XR
    
    style Internet fill:#93c5fd
    style CF fill:#fbbf24
    style RDS fill:#fca5a5
    style S3 fill:#86efac
```

### 5.2 Docker Compose Architecture

```mermaid
graph TB
    subgraph "Docker Network: smart-system-network"
        subgraph "Frontend Tier"
            NGINX[nginx:alpine<br/>Port 80, 443]
            NEXT[next:latest<br/>Port 3000]
        end
        
        subgraph "Backend Tier"
            FLASK[flask:3.1<br/>Port 5000]
            CELERY[celery-worker]
            BEAT[celery-beat]
        end
        
        subgraph "Data Tier"
            PG[(postgres:15<br/>Port 5432)]
            RD[(redis:7<br/>Port 6379)]
        end
        
        subgraph "Monitoring Tier"
            PROM[prometheus<br/>Port 9090]
            GRAF[grafana<br/>Port 3001]
        end
    end
    
    subgraph "Volumes"
        PG_DATA[postgres_data]
        RD_DATA[redis_data]
        UPLOADS[backend_uploads]
    end
    
    NGINX --> NEXT
    NGINX --> FLASK
    
    NEXT --> FLASK
    
    FLASK --> PG
    FLASK --> RD
    
    CELERY --> RD
    CELERY --> PG
    
    BEAT --> RD
    
    PROM --> FLASK
    PROM --> PG
    PROM --> RD
    
    GRAF --> PROM
    
    PG -.mount.-> PG_DATA
    RD -.mount.-> RD_DATA
    FLASK -.mount.-> UPLOADS
    
    style NGINX fill:#86efac
    style FLASK fill:#93c5fd
    style PG fill:#fca5a5
    style PROM fill:#fbbf24
```

---

## 6. Diagrammes de Flux de Données

### 6.1 Data Flow - Génération QCM

```mermaid
flowchart LR
    A[Document PDF/DOCX] --> B[PyPDF2/python-docx<br/>Extraction texte]
    B --> C[Texte brut]
    
    C --> D[Preprocessing<br/>- Nettoyage<br/>- Tokenization<br/>- Segmentation]
    
    D --> E[Chunks de texte]
    
    E --> F{Type génération?}
    
    F -->|Template-based| G[Règles heuristiques]
    F -->|AI-based| H[Hugging Face T5]
    
    G --> I[Questions basiques]
    H --> J[Questions avancées]
    
    I --> K[Validation syntaxique]
    J --> K
    
    K --> L{Questions valides?}
    
    L -->|Non| M[Rejeter + retry]
    M --> F
    
    L -->|Oui| N[Génération distracteurs<br/>GPT-2]
    
    N --> O[QCM complet structuré]
    
    O --> P[(Sauvegarde PostgreSQL)]
    
    P --> Q[QCM ID retourné]
    
    style A fill:#fef3c7
    style H fill:#bfdbfe
    style N fill:#bbf7d0
    style P fill:#fca5a5
```

### 6.2 Data Flow - Correction Automatique

```mermaid
flowchart TB
    A[Réponses étudiant] --> B{Type question?}
    
    B -->|QCM| C[Comparaison exacte]
    C --> D{Correct?}
    D -->|Oui| E[Score = 100%]
    D -->|Non| F[Score = 0%]
    
    B -->|Ouverte| G[Extraction features]
    
    G --> H[Tokenization BERT]
    G --> I[Extraction mots-clés TF-IDF]
    
    H --> J[Embeddings sémantiques]
    
    J --> K[Réponse attendue embedding]
    J --> L[Réponse étudiant embedding]
    
    K --> M[Calcul similarité cosinus]
    L --> M
    
    I --> N[Score mots-clés]
    
    M --> O[Score sémantique]
    
    O --> P[Pondération<br/>70% sémantique<br/>30% mots-clés]
    N --> P
    
    P --> Q[Score final 0-100]
    
    E --> R[Feedback génération GPT-2]
    F --> R
    Q --> R
    
    R --> S[Feedback personnalisé]
    
    S --> T[(Sauvegarde résultat)]
    
    style B fill:#fef3c7
    style H fill:#bfdbfe
    style R fill:#c7d2fe
    style T fill:#fca5a5
```

---

## 7. Diagrammes de Composants (Frontend Next.js)

### 7.1 Architecture Composants Next.js

```mermaid
graph TB
    subgraph "App Router"
        ROOT[Root Layout]
        
        subgraph "Route Groups"
            MARKETING["(marketing)<br/>Layout"]
            AUTH["(auth)<br/>Layout"]
            DASH["(dashboard)<br/>Layout"]
        end
        
        subgraph "Pages"
            HOME[page.tsx<br/>Home]
            LOGIN[login/page.tsx]
            ENS[enseignant/page.tsx]
            ETU[etudiant/page.tsx]
            ADM[admin/page.tsx]
        end
    end
    
    subgraph "Features"
        AUTH_FEAT[auth/]
        QCM_FEAT[qcm/]
        CORR_FEAT[correction/]
        STAT_FEAT[statistics/]
    end
    
    subgraph "Shared"
        UI[components/ui/]
        HOOKS[hooks/]
        SERVICES[services/]
        TYPES[types/]
    end
    
    subgraph "Core"
        PROVIDERS[providers/]
        MIDDLEWARE[middleware.ts]
        CONFIG[config/]
    end
    
    ROOT --> MARKETING
    ROOT --> AUTH
    ROOT --> DASH
    
    MARKETING --> HOME
    AUTH --> LOGIN
    DASH --> ENS
    DASH --> ETU
    DASH --> ADM
    
    LOGIN --> AUTH_FEAT
    ENS --> QCM_FEAT
    ENS --> STAT_FEAT
    ETU --> QCM_FEAT
    ETU --> CORR_FEAT
    
    AUTH_FEAT --> SERVICES
    QCM_FEAT --> SERVICES
    QCM_FEAT --> UI
    
    SERVICES --> HOOKS
    UI --> TYPES
    
    ROOT --> PROVIDERS
    ROOT --> MIDDLEWARE
    PROVIDERS --> CONFIG
    
    style ROOT fill:#60a5fa
    style AUTH_FEAT fill:#34d399
    style UI fill:#fbbf24
    style PROVIDERS fill:#a78bfa
```

---

## 8. Diagrammes de Performance

### 8.1 Performance Optimization Pipeline

```mermaid
flowchart LR
    subgraph "Client Side"
        A[User Request] --> B{Cached?}
        B -->|Yes| C[Browser Cache<br/>Instant]
        B -->|No| D[Request to CDN]
    end
    
    subgraph "CDN Layer"
        D --> E{CDN Cache?}
        E -->|Yes| F[CloudFront<br/><50ms]
        E -->|No| G[Forward to Origin]
    end
    
    subgraph "Server Side"
        G --> H{Next.js SSG?}
        H -->|Yes| I[Static HTML<br/><100ms]
        H -->|No| J{ISR Cache?}
        
        J -->|Yes| K[Stale HTML<br/>Revalidate async<br/><200ms]
        J -->|No| L[SSR<br/>Dynamic render<br/><500ms]
    end
    
    subgraph "API Layer"
        L --> M{Redis Cache?}
        M -->|Yes| N[Cached Data<br/><50ms]
        M -->|No| O[Database Query<br/><200ms]
        
        O --> P[Cache Result]
        P --> N
    end
    
    C --> Q[Render<br/>Total: <50ms]
    F --> Q
    I --> R[Render<br/>Total: <150ms]
    K --> S[Render<br/>Total: <250ms]
    N --> T[Render<br/>Total: <550ms]
    
    style C fill:#86efac
    style F fill:#86efac
    style I fill:#93c5fd
    style K fill:#fbbf24
    style N fill:#fca5a5
```

### 8.2 Scaling Strategy

```mermaid
graph TB
    subgraph "Load Balancing"
        LB[Load Balancer<br/>ALB/Nginx]
    end
    
    subgraph "Auto Scaling Group"
        INST1[Instance 1<br/>Next.js + Flask]
        INST2[Instance 2<br/>Next.js + Flask]
        INST3[Instance 3<br/>Next.js + Flask]
        INST_N[Instance N<br/>...auto-scale]
    end
    
    subgraph "Worker Pool"
        W1[Celery Worker 1<br/>IA Tasks]
        W2[Celery Worker 2<br/>IA Tasks]
        W3[Celery Worker N<br/>...auto-scale]
    end
    
    subgraph "Data Layer"
        RDS_PRIMARY[(RDS Primary<br/>Write)]
        RDS_REPLICA[(RDS Replica<br/>Read)]
        REDIS_CLUSTER[(Redis Cluster<br/>3 nodes)]
    end
    
    LB --> INST1
    LB --> INST2
    LB --> INST3
    LB --> INST_N
    
    INST1 --> RDS_PRIMARY
    INST2 --> RDS_REPLICA
    INST3 --> RDS_REPLICA
    
    INST1 --> REDIS_CLUSTER
    INST2 --> REDIS_CLUSTER
    INST3 --> REDIS_CLUSTER
    
    W1 --> REDIS_CLUSTER
    W2 --> REDIS_CLUSTER
    W3 --> REDIS_CLUSTER
    
    W1 --> RDS_PRIMARY
    W2 --> RDS_PRIMARY
    
    style LB fill:#86efac
    style RDS_PRIMARY fill:#fca5a5
    style REDIS_CLUSTER fill:#fbbf24
```

---

**📊 Fin des Diagrammes Mermaid**

Ces diagrammes couvrent tous les aspects techniques du système :
- ✅ Cas d'utilisation par rôle
- ✅ Séquences d'interactions complètes
- ✅ Architecture logicielle (classes, composants)
- ✅ États et workflows
- ✅ Déploiement et infrastructure
- ✅ Flux de données et pipelines
- ✅ Performance et scaling

Tous les diagrammes sont en format Mermaid et peuvent être intégrés directement dans la documentation Markdown.


