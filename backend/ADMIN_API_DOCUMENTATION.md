# Documentation API Admin - Gestion Complète

Cette documentation couvre toutes les routes d'administration pour la gestion complète du système.

## Table des Matières

1. [Gestion des Étudiants](#gestion-des-étudiants)
2. [Gestion des Professeurs](#gestion-des-professeurs)
3. [Affectation Matières-Professeurs](#affectation-matières-professeurs)
4. [Configuration IA](#configuration-ia)
5. [Gestion Sessions (Admin)](#gestion-sessions-admin)
6. [Gestion Résultats (Admin)](#gestion-résultats-admin)

---

## Gestion des Étudiants

### Liste des étudiants

```http
GET /api/admin/etudiants
```

**Query Parameters:**
- `page` (int, default: 1) - Numéro de la page
- `per_page` (int, default: 10) - Éléments par page
- `search` (string, optional) - Recherche par nom ou email
- `niveau_id` (string, optional) - Filtrer par niveau

**Response:**
```json
{
  "etudiants": [...],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 50,
    "pages": 5
  }
}
```

### Détail d'un étudiant

```http
GET /api/admin/etudiants/{etudiant_id}
```

### Créer un étudiant

```http
POST /api/admin/etudiants
```

**Body:**
```json
{
  "email": "etudiant@example.com",
  "name": "Jean Dupont",
  "password": "motdepasse123",
  "numeroEtudiant": "E2024001",
  "telephone": "+33612345678",
  "dateNaissance": "2000-01-15",
  "niveauIds": ["niveau-id-1"],
  "classeIds": ["classe-id-1"],
  "matiereIds": ["matiere-id-1", "matiere-id-2"],
  "anneeScolaire": "2024-2025"
}
```

### Mettre à jour un étudiant

```http
PUT /api/admin/etudiants/{etudiant_id}
```

**Body:**
```json
{
  "name": "Jean Dupont",
  "telephone": "+33612345678",
  "emailVerified": true
}
```

### Supprimer un étudiant

```http
DELETE /api/admin/etudiants/{etudiant_id}
```

### Assigner niveaux/classes/matières

```http
POST /api/admin/etudiants/{etudiant_id}/assign
```

**Body:**
```json
{
  "niveauIds": ["niveau-id-1"],
  "classeIds": ["classe-id-1"],
  "matiereIds": ["matiere-id-1", "matiere-id-2"],
  "anneeScolaire": "2024-2025"
}
```

---

## Gestion des Professeurs

### Liste des professeurs

```http
GET /api/admin/professeurs
```

**Query Parameters:**
- `page` (int, default: 1)
- `per_page` (int, default: 10)
- `search` (string, optional)
- `matiere_id` (string, optional) - Filtrer par matière

### Détail d'un professeur

```http
GET /api/admin/professeurs/{professeur_id}
```

### Créer un professeur

```http
POST /api/admin/professeurs
```

**Body:**
```json
{
  "email": "prof@example.com",
  "name": "Marie Martin",
  "password": "motdepasse123",
  "numeroEnseignant": "P2024001",
  "telephone": "+33612345678",
  "matiereIds": ["matiere-id-1", "matiere-id-2"],
  "niveauIds": ["niveau-id-1", "niveau-id-2"],
  "classeIds": ["classe-id-1"],
  "anneeScolaire": "2024-2025"
}
```

### Mettre à jour un professeur

```http
PUT /api/admin/professeurs/{professeur_id}
```

### Supprimer un professeur

```http
DELETE /api/admin/professeurs/{professeur_id}
```

### Assigner matières/niveaux/classes

```http
POST /api/admin/professeurs/{professeur_id}/assign
```

**Body:**
```json
{
  "matiereIds": ["matiere-id-1"],
  "niveauIds": ["niveau-id-1"],
  "classeIds": ["classe-id-1"],
  "anneeScolaire": "2024-2025"
}
```

---

## Affectation Matières-Professeurs

### Récupérer les professeurs d'une matière

```http
GET /api/admin/matieres/{matiere_id}/professeurs
```

### Affecter des professeurs à une matière

```http
POST /api/admin/matieres/{matiere_id}/professeurs
```

**Body:**
```json
{
  "professeurIds": ["prof-id-1", "prof-id-2"],
  "anneeScolaire": "2024-2025"
}
```

---

## Configuration IA

### Liste des configurations

```http
GET /api/admin/ai-configs
```

**Query Parameters:**
- `actifs_seulement` (boolean, default: false)

### Configuration par défaut

```http
GET /api/admin/ai-configs/default
```

### Détail d'une configuration

```http
GET /api/admin/ai-configs/{config_id}
```

### Créer une configuration

```http
POST /api/admin/ai-configs
```

**Body:**
```json
{
  "nom": "Mistral 7B Instruct",
  "provider": "huggingface",
  "modelId": "mistralai/Mistral-7B-Instruct-v0.2",
  "description": "Modèle Mistral optimisé",
  "apiUrl": "https://api-inference.huggingface.co/models/...",
  "maxTokens": 2048,
  "temperature": 0.7,
  "topP": 0.9,
  "timeoutSeconds": 60,
  "actif": true,
  "estDefaut": false,
  "ordrePriorite": 1
}
```

**Providers valides:** `huggingface`, `openai`, `anthropic`, `local`

### Mettre à jour une configuration

```http
PUT /api/admin/ai-configs/{config_id}
```

### Supprimer une configuration

```http
DELETE /api/admin/ai-configs/{config_id}
```

### Définir comme défaut

```http
POST /api/admin/ai-configs/{config_id}/set-default
```

### Appliquer une configuration

```http
POST /api/admin/ai-configs/{config_id}/apply
```

Cette route applique la configuration aux variables d'environnement du système.

### Initialiser les configurations par défaut

```http
POST /api/admin/ai-configs/init-defaults
```

Crée automatiquement 4 configurations :
- Mistral 7B Instruct (défaut)
- Llama 3.2 3B
- Phi-3 Mini
- Qwen 2.5 1.5B

---

## Gestion Sessions (Admin)

### Liste des sessions (toutes)

```http
GET /api/admin/sessions
```

**Query Parameters:**
- `page` (int, default: 1)
- `per_page` (int, default: 10)
- `status` (string, optional) - `programmee`, `en_cours`, `terminee`, `annulee`
- `qcm_id` (string, optional)

**Note:** Contrairement à l'API standard, l'admin voit TOUTES les sessions, pas seulement celles qu'il a créées.

### Mettre à jour une session

```http
PUT /api/admin/sessions/{session_id}
```

**Body:**
```json
{
  "titre": "Nouveau titre",
  "status": "en_cours",
  "notePassage": 12.0
}
```

### Supprimer une session

```http
DELETE /api/admin/sessions/{session_id}
```

---

## Gestion Résultats (Admin)

### Liste des résultats (tous)

```http
GET /api/admin/resultats
```

**Query Parameters:**
- `page` (int, default: 1)
- `per_page` (int, default: 10)
- `etudiant_id` (string, optional)
- `session_id` (string, optional)
- `status` (string, optional)

### Mettre à jour un résultat

```http
PUT /api/admin/resultats/{resultat_id}
```

**Body:**
```json
{
  "estValide": true,
  "commentaireProf": "Bon travail",
  "noteProf": 15.5,
  "status": "termine"
}
```

**Cas d'usage :** Valider/invalider un résultat (détection de triche), ajuster une note, forcer un statut.

### Supprimer un résultat

```http
DELETE /api/admin/resultats/{resultat_id}
```

### Statistiques globales

```http
GET /api/admin/resultats/stats
```

**Response:**
```json
{
  "total": 150,
  "termines": 120,
  "reussis": 90,
  "taux_reussite": 75.0,
  "moyenne_generale": 13.2
}
```

---

## Authentification

Toutes ces routes nécessitent :
1. Un token JWT valide dans le header `Authorization: Bearer <token>`
2. Un rôle `admin` pour l'utilisateur

**Exemple de requête :**
```bash
curl -X GET "http://localhost:5000/api/admin/etudiants" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Migration de la Base de Données

Après avoir mis en place ces changements, exécutez la migration :

```bash
cd backend
flask db upgrade
```

Cela créera la table `ai_model_configs`.

## Initialisation

Pour initialiser les configurations IA par défaut :

```bash
curl -X POST "http://localhost:5000/api/admin/ai-configs/init-defaults" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Codes d'Erreur

| Code | Description |
|------|-------------|
| 200 | Succès |
| 201 | Créé avec succès |
| 400 | Erreur de validation / Données invalides |
| 403 | Accès interdit (nécessite le rôle admin) |
| 404 | Ressource non trouvée |
| 500 | Erreur serveur |

---

## Notes Importantes

### Gestion des Étudiants et Professeurs

- Les étudiants ont automatiquement le rôle `etudiant`
- Les professeurs ont automatiquement le rôle `enseignant`
- Un email ne peut être utilisé qu'une seule fois dans le système
- Les mots de passe doivent contenir au moins 8 caractères
- Les numéros d'étudiant/enseignant sont optionnels mais doivent être uniques s'ils sont fournis

### Affectations

- Les affectations sont liées à une année scolaire (ex: "2024-2025")
- Un étudiant peut avoir plusieurs niveaux/classes/matières
- Un professeur peut enseigner plusieurs matières à plusieurs niveaux
- Les affectations passées sont conservées avec `est_actuel=false`

### Configuration IA

- Une seule configuration peut être marquée comme défaut
- Les configurations peuvent être activées/désactivées sans être supprimées
- L'ordre de priorité définit l'ordre des fallbacks en cas d'échec
- Appliquer une configuration modifie les variables d'environnement du serveur

### Sessions et Résultats

- L'admin a un accès total sans restriction de créateur
- Les modifications de résultats sont tracées (admin peut ajuster les notes)
- La suppression de sessions ou résultats est définitive (aucune restauration)


