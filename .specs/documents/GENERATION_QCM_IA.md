# Génération de QCM avec IA - Documentation

## 📚 Vue d'ensemble

Le système AI-KO intègre une génération automatique de questions de QCM utilisant **Qwen2.5-7B-Instruct**, un modèle de langage open-source de pointe, via l'API Hugging Face Inference.

## 🎯 Modèle IA Utilisé

### Qwen2.5-7B-Instruct

- **Développeur:** Alibaba Cloud
- **Taille:** 7 milliards de paramètres
- **Type:** Modèle de génération de texte instruction-tuned
- **Points forts:**
  - Excellente compréhension du français
  - Génération structurée (JSON, XML, etc.)
  - Raisonnement logique et pédagogique
  - Très rapide via API Inference

**Pourquoi ce modèle?**
- ✅ Open-source (licence permissive)
- ✅ Performances comparables à GPT-3.5
- ✅ Excellente pour la génération éducative
- ✅ API gratuite avec token Hugging Face
- ✅ Pas de téléchargement local nécessaire

## 🔧 Configuration

### 1. Obtenir un Token Hugging Face

1. Créez un compte sur [Hugging Face](https://huggingface.co)
2. Allez dans [Settings > Access Tokens](https://huggingface.co/settings/tokens)
3. Créez un nouveau token avec les permissions de lecture
4. Copiez le token

### 2. Configurer le Token

Ajoutez le token dans votre fichier `.env` :

```bash
# Token Hugging Face pour l'API Inference
HF_API_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Vérifier les Dépendances

Les dépendances suivantes sont requises (déjà dans `requirements.txt`) :

```bash
# Extraction de documents
PyPDF2==3.0.1
python-docx==1.1.2

# API HTTP
requests==2.32.3

# Celery pour l'asynchrone
celery==5.4.0
redis==5.2.1
```

## 🚀 Utilisation

### Workflow de Génération

```
1. Enseignant crée un QCM → Frontend
2. Enseignant fournit texte/document → Frontend
3. Backend crée QCM vide en DB
4. Tâche Celery lancée (asynchrone)
5. Extraction du texte (si document)
6. Nettoyage et préparation du texte
7. Appel API Hugging Face (Qwen2.5)
8. Parsing et validation des questions
9. Enregistrement en base de données
10. Notification frontend (polling)
```

### API Endpoints

#### Génération depuis Texte

```http
POST /api/qcm/generate/text
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "titre": "QCM de Mathématiques",
  "text": "Le théorème de Pythagore stipule que...",
  "num_questions": 10,
  "matiere": "Mathématiques",
  "niveau": "L1",
  "duree": 60
}
```

**Réponse:**
```json
{
  "task_id": "abc-123-def",
  "status": "PENDING",
  "qcm_id": "qcm-uuid",
  "message": "Génération en cours..."
}
```

#### Génération depuis Document

```http
POST /api/qcm/generate/document
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "titre": "QCM sur le Chapitre 5",
  "file_content": "<base64_encoded_file>",
  "file_type": "pdf",
  "num_questions": 15,
  "matiere": "Physique",
  "niveau": "L2"
}
```

#### Vérifier le Statut de la Tâche

```http
GET /api/qcm/tasks/{task_id}
Authorization: Bearer <jwt_token>
```

**Réponses possibles:**

```json
// En cours
{
  "task_id": "abc-123",
  "status": "PROGRESS",
  "result": {
    "status": "Génération des questions avec l'IA...",
    "progress": 40
  }
}

// Succès
{
  "task_id": "abc-123",
  "status": "SUCCESS",
  "result": {
    "qcm_id": "qcm-uuid",
    "titre": "QCM de Mathématiques",
    "num_questions": 10,
    "status": "success",
    "message": "QCM généré avec succès: 10 questions créées"
  }
}

// Erreur
{
  "task_id": "abc-123",
  "status": "FAILURE",
  "error": "Le modèle met trop de temps à charger..."
}
```

## 🧠 Architecture du Service IA

### 1. Document Parser (`app/services/document_parser.py`)

**Responsabilités:**
- Extraction de texte depuis PDF (PyPDF2)
- Extraction de texte depuis DOCX (python-docx)
- Nettoyage et normalisation du texte
- Troncature à 8000 caractères (limite du modèle)

**Exemple:**
```python
from app.services.document_parser import DocumentParser

# Extraire depuis PDF
text = DocumentParser.extract_from_pdf(pdf_bytes)

# Nettoyer le texte
clean_text = DocumentParser.clean_text(text, max_length=8000)
```

### 2. AI Service (`app/services/ai_service.py`)

**Responsabilités:**
- Construction du prompt pour Qwen2.5
- Appel API Hugging Face Inference
- Parsing JSON depuis la réponse du modèle
- Validation des questions générées
- Gestion des erreurs et retries

**Configuration:**
```python
class AIService:
    model = "Qwen/Qwen2.5-7B-Instruct"
    api_url = "https://api-inference.huggingface.co/models/{model}"
    max_retries = 3
    timeout = 60
```

**Prompt Engineering:**

Le service construit un prompt structuré avec :
- Contexte (matière, niveau)
- Texte source
- Instructions claires pour le format JSON
- Règles de validation (4 options, 1 correcte, etc.)

### 3. Tâches Celery (`app/tasks/quiz_generation.py`)

**Tâches asynchrones:**

- `generate_quiz_from_text`: Génération depuis texte brut
- `generate_quiz_from_document`: Génération depuis PDF/DOCX

**États de progression:**
1. `PROGRESS(10%)` - Analyse du texte
2. `PROGRESS(30%)` - Génération IA
3. `PROGRESS(70%)` - Enregistrement DB
4. `SUCCESS(100%)` - Terminé

## 📋 Format des Questions Générées

### Structure JSON

```json
{
  "questions": [
    {
      "enonce": "Quelle est la formule du théorème de Pythagore?",
      "type": "qcm",
      "options": [
        {
          "texte": "a² + b² = c²",
          "estCorrecte": true
        },
        {
          "texte": "a + b = c",
          "estCorrecte": false
        },
        {
          "texte": "a² - b² = c²",
          "estCorrecte": false
        },
        {
          "texte": "a × b = c",
          "estCorrecte": false
        }
      ],
      "explication": "Le théorème de Pythagore stipule que dans un triangle rectangle, le carré de l'hypoténuse est égal à la somme des carrés des deux autres côtés.",
      "points": 1
    }
  ]
}
```

### Validation Automatique

Le service vérifie:
- ✅ Énoncé non vide
- ✅ Au moins 2 options
- ✅ Exactement 1 option correcte
- ✅ Options non vides
- ✅ JSON valide

Si une question ne respecte pas les règles, elle est corrigée ou ignorée.

## ⚙️ Configuration Avancée

### Modifier le Modèle

Pour utiliser un autre modèle Hugging Face, modifiez `ai_service.py` :

```python
class AIService:
    # Modèle alternatif : Mistral-7B-Instruct
    self.model = "mistralai/Mistral-7B-Instruct-v0.2"

    # Ou : Meta-Llama-3-8B-Instruct (nécessite approbation)
    # self.model = "meta-llama/Meta-Llama-3-8B-Instruct"
```

### Ajuster les Paramètres de Génération

```python
payload = {
    "inputs": prompt,
    "parameters": {
        "max_new_tokens": 2048,      # Longueur max de la réponse
        "temperature": 0.7,           # Créativité (0.1-1.0)
        "top_p": 0.9,                 # Nucleus sampling
        "do_sample": True,            # Activer l'échantillonnage
        "return_full_text": False     # Ne retourner que le nouveau texte
    }
}
```

**Recommandations:**
- `temperature = 0.7` : Bon équilibre pour les QCM
- `temperature < 0.5` : Plus déterministe, questions plus factuelles
- `temperature > 0.8` : Plus créatif, questions plus variées

### Gestion des Erreurs

**Erreur 503 - Modèle en chargement:**
- Le service attend 10 secondes et réessaie
- 3 tentatives maximum
- Message : "Le modèle met trop de temps à charger"

**Solution:** Réessayer après quelques minutes ou utiliser un modèle plus léger.

## 🔍 Débogage

### Activer les Logs Détaillés

```python
# config.py
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger('app.services.ai_service')
logger.setLevel(logging.DEBUG)
```

### Tester le Service IA Directement

```python
from app.services.ai_service import ai_service

text = """
Le théorème de Pythagore est fondamental en géométrie.
Il s'applique aux triangles rectangles.
"""

questions = ai_service.generate_questions(
    text=text,
    num_questions=3,
    matiere="Mathématiques",
    niveau="L1"
)

print(f"{len(questions)} questions générées:")
for q in questions:
    print(f"- {q['enonce']}")
```

### Tester l'Extraction de Documents

```python
from app.services.document_parser import DocumentParser

with open('cours.pdf', 'rb') as f:
    pdf_bytes = f.read()

text = DocumentParser.extract_from_pdf(pdf_bytes)
print(f"Texte extrait: {len(text)} caractères")
```

## 📊 Performances

### Temps de Génération Estimés

| Nombre de Questions | Temps Moyen |
|---------------------|-------------|
| 5 questions         | 15-30s      |
| 10 questions        | 30-60s      |
| 15 questions        | 45-90s      |
| 20 questions        | 60-120s     |

**Facteurs d'influence:**
- Charge du serveur Hugging Face
- Longueur du texte source
- Complexité du sujet

### Optimisations

1. **Texte pré-nettoyé:** Limite à 8000 caractères
2. **Retries intelligents:** 3 tentatives avec attente
3. **Timeout adaptatif:** 60 secondes par appel
4. **Cache modèle:** (côté Hugging Face)

## 🚨 Limitations

### Limitations Actuelles

1. **Taille du texte:** Max 8000 caractères (limite Qwen2.5)
2. **Nombre de questions:** Max 20 par génération (pour maintenir la qualité)
3. **Types de questions:** Uniquement QCM à 4 options
4. **Langues:** Optimisé pour le français (supporte anglais)

### Améliorations Futures

- [ ] Support de questions ouvertes
- [ ] Support de questions vrai/faux
- [ ] Génération d'images avec DALL-E
- [ ] Analyse de qualité des questions
- [ ] Suggestions de difficultés

## 📝 Exemples d'Utilisation

### Exemple 1: Génération Depuis Texte (Python)

```python
import requests

url = "http://localhost:5000/api/qcm/generate/text"
headers = {"Authorization": "Bearer <token>"}

data = {
    "titre": "QCM Python Débutant",
    "text": """
    Python est un langage de programmation interprété.
    Il utilise l'indentation pour structurer le code.
    Les variables n'ont pas besoin de déclaration de type.
    """,
    "num_questions": 5,
    "matiere": "Informatique",
    "niveau": "L1"
}

response = requests.post(url, json=data, headers=headers)
task_id = response.json()['task_id']

# Polling du statut
import time
while True:
    status_response = requests.get(
        f"http://localhost:5000/api/qcm/tasks/{task_id}",
        headers=headers
    )
    status = status_response.json()

    if status['status'] == 'SUCCESS':
        print("QCM généré avec succès!")
        print(status['result'])
        break
    elif status['status'] == 'FAILURE':
        print("Erreur:", status['error'])
        break

    time.sleep(2)
```

### Exemple 2: Génération Depuis Document (Frontend)

```typescript
// Déjà implémenté dans QCMGenerateForm.tsx
const file = fileInput.files[0]
const base64 = await qcmService.fileToBase64(file)

const response = await qcmService.generateFromDocument({
  titre: "QCM Chapitre 5",
  file_content: base64,
  file_type: "pdf",
  num_questions: 10,
  matiere: "Mathématiques",
  niveau: "L2"
})

// Polling avec useTaskPolling hook
const { progress, taskStatus } = useTaskPolling({
  taskId: response.task_id,
  onSuccess: (result) => {
    router.push(`/enseignant/qcm/${result.qcm_id}`)
  }
})
```

## 🔒 Sécurité

### Bonnes Pratiques

1. **Token HF_API_TOKEN:** Ne JAMAIS commiter dans le code
2. **Validation côté serveur:** Toujours valider les fichiers uploadés
3. **Limite de taille:** Max 10 Mo pour les documents
4. **Rate limiting:** Limiter les appels API par utilisateur
5. **Timeouts:** Configurer des timeouts appropriés

### Variables d'Environnement Sensibles

```bash
# .env
HF_API_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxx  # ⚠️ NE PAS COMMITER

# ✅ Utiliser des secrets management en production
# - AWS Secrets Manager
# - Azure Key Vault
# - HashiCorp Vault
```

## 📞 Support

### Problèmes Courants

**Problème:** "HF_API_TOKEN non défini"
- **Solution:** Configurer le token dans `.env`

**Problème:** "Le modèle met trop de temps à charger"
- **Solution:** Réessayer après 5-10 minutes (le modèle se met en cache)

**Problème:** "Impossible de parser la réponse du modèle en JSON"
- **Solution:** Le modèle peut avoir généré du texte invalide. Réessayer ou ajuster le prompt.

**Problème:** "Timeout lors de la génération"
- **Solution:** Réduire le nombre de questions ou la taille du texte

---

**🎓 AI-KO - Génération Intelligente de QCM**
