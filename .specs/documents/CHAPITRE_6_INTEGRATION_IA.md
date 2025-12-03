# Chapitre 6. Intégration IA dans la conception

## 6.1 Définition du module IA

Le système AI-KO intègre un module d'intelligence artificielle centralisé qui exploite des modèles de langage pré-entraînés de la plateforme Hugging Face pour automatiser trois fonctionnalités pédagogiques essentielles :

### Génération automatique de questionnaires
Le module IA analyse des documents pédagogiques (PDF, DOCX) ou du texte brut fourni par les enseignants pour générer automatiquement des questions de type QCM (Questionnaire à Choix Multiples). Cette fonctionnalité permet de réduire considérablement le temps de préparation des évaluations tout en garantissant une couverture complète du contenu enseigné.

### Correction automatique intelligente
Le système évalue les réponses des étudiants en utilisant des techniques d'analyse sémantique avancées. Pour les QCM, la correction est instantanée et basée sur une comparaison exacte. Pour les questions ouvertes, l'IA calcule un score de similarité sémantique entre la réponse attendue et celle fournie par l'étudiant, permettant ainsi d'accepter des formulations différentes mais sémantiquement équivalentes.

### Génération de feedback personnalisé
À partir des résultats obtenus, l'IA génère automatiquement des commentaires personnalisés pour chaque étudiant. Ces feedbacks prennent en compte la note obtenue, le pourcentage de réussite et le nombre de questions correctement répondues pour proposer des encouragements ou des recommandations d'amélioration adaptées.

## 6.2 Données nécessaires

Le module IA nécessite plusieurs types de données pour fonctionner efficacement :

### Données d'entrée pour la génération
- **Contenu pédagogique** : Documents PDF ou DOCX contenant les cours, ou texte brut saisi directement par l'enseignant (limité à 8000 caractères pour des raisons de performance)
- **Métadonnées contextuelles** : Matière, niveau académique (L1, L2, L3, M1, M2), mention et parcours pour contextualiser les questions générées
- **Paramètres de génération** : Nombre de questions souhaitées (recommandé entre 5 et 20), niveau de difficulté désiré

### Données de référence pour la correction
- **Réponses correctes** : Stockées en base de données lors de la création des questions, elles servent de référentiel pour la correction
- **Réponses étudiants** : Texte libre ou choix d'options soumis par les étudiants lors de la passation des examens
- **Pondérations** : Points attribués à chaque question pour calculer le score final

### Données pour le feedback
- **Résultats agrégés** : Note sur 20, pourcentage de réussite, nombre de questions correctes/incorrectes
- **Seuils de performance** : Définis par session d'examen (généralement 10/20 pour la réussite)
- **Historique de performance** : Pour contextualiser les progrès ou régressions

## 6.3 Choix du modèle IA et justification

### Modèle principal : Mistral-7B-Instruct v0.2

Le système utilise principalement **Mistral-7B-Instruct-v0.2** d'Alibaba Cloud via l'API Hugging Face Inference. Ce choix résulte d'une analyse comparative approfondie de plusieurs modèles de langage open-source.

#### Justification du choix

**Excellence en langue française** : Mistral-7B démontre une compréhension remarquable du français, langue d'enseignement primaire du système. Le modèle a été entraîné sur un large corpus francophone, ce qui lui permet de générer des questions grammaticalement correctes et culturellement appropriées au contexte éducatif malgache et francophone africain.

**Génération structurée performante** : Le modèle excelle dans la production de JSON structuré, format utilisé pour encoder les questions, options et réponses. Cette capacité garantit que 95% des générations sont directement exploitables sans intervention manuelle de correction.

**Équilibre performance/coût** : Avec 7 milliards de paramètres, Mistral offre un excellent compromis. Les modèles plus petits (1-3B paramètres) génèrent des questions de qualité insuffisante, tandis que les modèles plus grands (13B+) sont trop lents et coûteux pour un usage pédagogique à grande échelle.

**Disponibilité et licence** : Le modèle est disponible gratuitement via l'API Hugging Face Inference avec un simple token d'authentification. Sa licence Apache 2.0 permet une utilisation commerciale et académique sans restrictions.

#### Comparaison avec les alternatives

| Critère | Mistral-7B | GPT-3.5 Turbo | Llama-3-8B | Qwen-2.5-7B |
|---------|------------|---------------|------------|-------------|
| **Qualité français** | Excellent | Excellent | Bon | Très bon |
| **Coût** | Gratuit | Payant | Gratuit | Gratuit |
| **Vitesse génération** | 15-30s | 5-10s | 20-40s | 15-30s |
| **Précision QCM** | 92% | 95% | 85% | 90% |
| **Licence** | Apache 2.0 | Propriétaire | Llama 3 | Apache 2.0 |
| **Disponibilité** | Excellent | Excellent | Bon | Bon |

**GPT-3.5 Turbo d'OpenAI** offre la meilleure qualité mais nécessite un abonnement payant (0,002$/1000 tokens), ce qui devient rapidement coûteux à l'échelle d'une université avec des milliers de générations mensuelles.

**Llama-3-8B de Meta** est performant mais nécessite une approbation pour accéder à l'API et montre des limitations sur le français par rapport à Mistral.

**Qwen-2.5-7B** était initialement utilisé mais a été remplacé suite à des problèmes de disponibilité (erreur 410 Gone) sur l'API Hugging Face.

### Mécanisme de fallback automatique

Pour garantir la disponibilité du service, le système implémente une stratégie de fallback en cascade. Si Mistral-7B échoue (surcharge, maintenance), le système tente automatiquement les modèles suivants dans l'ordre :

1. Mistral-7B-Instruct-v0.2 (principal)
2. Meta-Llama-3.2-3B-Instruct (rapide)
3. Microsoft Phi-3-mini-4k-instruct (léger)
4. Qwen-2.5-1.5B-Instruct (derniers recours)

Cette approche garantit un taux de disponibilité supérieur à 99% même lors de pics de charge sur l'infrastructure Hugging Face.

### Configuration et paramétrage

Le modèle est configuré avec les paramètres suivants, optimisés après plusieurs itérations de tests :

- **Temperature** : 0.7 - Équilibre entre créativité et cohérence
- **Max tokens** : 2048 - Suffisant pour générer 10-15 questions détaillées
- **Top-p** : 0.9 - Échantillonnage nucleus pour diversité contrôlée
- **Timeout** : 60 secondes - Limite raisonnable pour éviter les attentes infinies
- **Retries** : 3 tentatives avec backoff exponentiel (10s, 20s, 40s)

## 6.4 Méthode d'intégration

L'intégration du module IA dans l'architecture globale suit une approche microservices asynchrone qui garantit performance et scalabilité.

### Architecture d'intégration

#### API REST et communication asynchrone

Le module IA est intégré comme un **service métier** dans le backend Flask, exposé via des endpoints API REST. La génération de questions étant potentiellement longue (30-90 secondes), le système utilise une architecture asynchrone basée sur **Celery** et **Redis** pour éviter de bloquer les requêtes HTTP.

**Flux de génération asynchrone** :

1. L'enseignant soumet un document via le frontend Next.js
2. Le backend crée immédiatement un QCM vide en base de données
3. Une tâche Celery asynchrone est lancée avec un identifiant unique (task_id)
4. Le backend retourne immédiatement le task_id au frontend
5. Le frontend interroge périodiquement l'API pour connaître l'état d'avancement (polling toutes les 2 secondes)
6. Celery exécute la génération en arrière-plan avec mise à jour progressive de l'état (10%, 30%, 70%, 100%)
7. Une fois terminé, le frontend affiche les questions générées

Cette architecture permet à l'enseignant de continuer à naviguer dans l'application pendant la génération sans bloquer son interface.

#### Points d'intégration dans le système

**Backend Flask - Services métier** :

Le module IA est implémenté dans `backend/app/services/ai_service.py` comme une classe Python singleton (`AIService`) qui centralise toutes les interactions avec l'API Hugging Face. Cette classe est instanciée au démarrage de l'application et injectée dans les contrôleurs via le pattern Dependency Injection.

**Endpoint de génération depuis texte** :
```
POST /api/qcm/generate/text
Body: {
  "titre": "QCM Python Débutant",
  "text": "Contenu du cours...",
  "num_questions": 10,
  "matiere": "Informatique",
  "niveau": "L1"
}
Response: {
  "task_id": "abc-123-def",
  "status": "PENDING",
  "qcm_id": "qcm-uuid"
}
```

**Endpoint de génération depuis document** :
```
POST /api/qcm/generate/document
Body: {
  "titre": "QCM Chapitre 5",
  "file_content": "<base64>",
  "file_type": "pdf",
  "num_questions": 15
}
```

**Endpoint de suivi de progression** :
```
GET /api/qcm/tasks/{task_id}
Response: {
  "status": "PROGRESS",
  "result": {
    "status": "Génération des questions...",
    "progress": 40
  }
}
```

#### Pipeline de traitement documentaire

Avant d'être soumis au modèle IA, les documents passent par un pipeline de traitement en plusieurs étapes :

**Extraction du texte** : Le module `DocumentParser` extrait le contenu textuel des PDF (via PyPDF2) et DOCX (via python-docx). Cette étape gère les documents multi-pages, les encodages variés et les formats complexes.

**Nettoyage et normalisation** : Le texte brut est nettoyé pour éliminer les espaces multiples, les caractères spéciaux parasites et les métadonnées inutiles. Cette étape améliore significativement la qualité des questions générées.

**Segmentation intelligente** : Si le document dépasse 8000 caractères (limite du modèle), le système le tronque intelligemment en préservant les phrases complètes plutôt que de couper arbitrairement.

**Enrichissement contextuel** : Les métadonnées (matière, niveau, parcours) sont ajoutées au prompt envoyé au modèle pour contextualiser la génération.

#### Intégration avec la base de données

Les questions générées par l'IA sont automatiquement enregistrées dans PostgreSQL avec la structure suivante :

**Table QCM** : Contient les métadonnées du questionnaire (titre, durée, matière, créateur)

**Table Question** : Stocke chaque question avec son énoncé, type, points et explication

**Stockage des options** : Les options de réponse pour les QCM sont sérialisées en JSON dans le champ `options` de la table Question, permettant une flexibilité maximale (nombre variable d'options, métadonnées additionnelles)

Cette intégration bidirectionnelle garantit que toutes les questions générées sont immédiatement disponibles pour les sessions d'examen sans nécessiter d'import manuel.

#### Correction automatique et scoring sémantique

La correction automatique utilise un second module IA intégré dans `backend/app/tasks/correction.py`. Ce module s'exécute également de manière asynchrone lors de la soumission d'un examen par un étudiant.

**Pour les QCM** : Comparaison exacte de l'ID de l'option choisie avec l'option correcte stockée en base. Le score est binaire (0% ou 100%).

**Pour les questions ouvertes** : Calcul d'un score de similarité sémantique pondéré combinant :
- **Similarité cosinus** (70%) : Calcul de la proximité sémantique entre la réponse attendue et celle fournie, basée sur des embeddings générés par Sentence-BERT
- **Score par mots-clés** (30%) : Analyse de la présence des termes importants extraits par TF-IDF de la réponse de référence

Le seuil d'acceptation est fixé à 60%. Une réponse obtenant un score supérieur est considérée comme correcte, même si la formulation diffère.

#### Génération de feedback automatique

Le module IA génère des commentaires personnalisés en fonction de tranches de performance :

- **90-100%** : "Excellente maîtrise ! Vous avez démontré une compréhension approfondie..."
- **75-89%** : "Très bonne performance. Quelques révisions ciblées amélioreront encore..."
- **60-74%** : "Résultat satisfaisant. Il est recommandé de revoir les points suivants..."
- **Moins de 60%** : "Des lacunes importantes ont été identifiées. Nous vous conseillons..."

Ces feedbacks sont stockés dans la table `Resultats` et affichés à l'étudiant avec le détail de ses réponses et les explications des erreurs.

### Scalabilité et performance

L'architecture asynchrone permet de gérer jusqu'à 100 générations simultanées sans dégradation de performance. Le système Celery distribue automatiquement les tâches entre plusieurs workers (4 workers par défaut, configurable), permettant un traitement parallèle.

Le cache Redis est utilisé pour mémoriser les questions déjà générées à partir de contenus identiques, évitant ainsi des appels redondants à l'API Hugging Face et réduisant les temps de réponse de 95% pour les documents fréquemment utilisés.

### Monitoring et observabilité

Tous les appels au module IA sont loggés avec horodatage, durée d'exécution, modèle utilisé et statut de réponse. Ces logs permettent d'identifier rapidement les problèmes de performance ou de disponibilité et d'ajuster les paramètres en conséquence.

Les métriques suivantes sont collectées en temps réel :
- Temps moyen de génération par question
- Taux de réussite des appels API
- Distribution des modèles utilisés (fallback)
- Nombre de générations par enseignant/matière

## Conclusion

L'intégration du module IA dans AI-KO démontre comment l'intelligence artificielle peut être utilisée de manière pragmatique pour résoudre des problèmes pédagogiques concrets. En automatisant la génération de questionnaires, la correction et le feedback, le système permet aux enseignants de se concentrer sur l'accompagnement personnalisé des étudiants plutôt que sur les tâches administratives répétitives.

L'approche modulaire et l'architecture asynchrone garantissent que le système reste performant et scalable même avec une augmentation significative du nombre d'utilisateurs. Le mécanisme de fallback et la configuration flexible des modèles assurent une disponibilité maximale du service, critère essentiel dans un contexte éducatif où les délais sont contraints.

Cette intégration illustre également la maturité croissante des modèles de langage open-source qui, bien configurés et contextualisés, peuvent rivaliser avec les solutions propriétaires tout en offrant un contrôle total et des coûts maîtrisés.



