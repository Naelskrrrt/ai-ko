# 💡 Recommandations d'Améliorations Stratégiques

**Document:** Roadmap d'améliorations  
**Date:** Novembre 2025  
**Priorité:** Court terme (3 mois), Moyen terme (6 mois), Long terme (12 mois)

---

## 7. Recommandations d'Améliorations

### 7.1 Améliorations Backend (Flask)

#### 🔴 Priorité CRITIQUE - À implémenter immédiatement

##### 1. Upgrade vers Flask 3.1+

**Problème actuel:** Flask 2.3.3 (version legacy)

**Solution:**
```python
# requirements.txt
Flask==3.1.0
Flask-SQLAlchemy==3.1.1
Werkzeug==3.1.0

# Changements nécessaires
# 1. Migration imports
from flask import Blueprint  # Plus de changements nécessaires

# 2. Configuration asynchrone (nouveau dans Flask 3.x)
@app.route('/api/qcm/generate', methods=['POST'])
async def generate_qcm():
    result = await hugging_face_service.generate_async(text)
    return jsonify(result)
```

**Bénéfices:**
- ✅ Support natif async/await (50% plus rapide pour IA)
- ✅ Meilleures performances (25% gain moyen)
- ✅ Sécurité améliorée
- ✅ Compatibilité Python 3.13+

##### 2. Implémentation Rate Limiting

**Problème actuel:** Pas de protection contre abus API

**Solution:**
```python
# requirements.txt
flask-limiter==3.5.0

# app/__init__.py
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="redis://localhost:6379"
)

# Utilisation sur routes coûteuses
@bp.route('/api/qcm/generate', methods=['POST'])
@limiter.limit("5 per minute")  # Max 5 générations/minute
def generate_qcm():
    pass

@bp.route('/api/qcm', methods=['GET'])
@limiter.limit("100 per minute")  # Lectures plus permissives
def get_qcms():
    pass
```

##### 3. Mise en place de Celery pour tâches asynchrones

**Problème actuel:** Génération IA bloque la requête HTTP (timeout après 30s)

**Architecture proposée:**

```mermaid
sequenceDiagram
    participant C as Client
    participant F as Flask API
    participant R as Redis Queue
    participant W as Celery Worker
    participant H as Hugging Face
    participant D as Database
    
    C->>F: POST /api/qcm/generate
    F->>R: Enqueue task
    F->>C: 202 Accepted {task_id: "abc123"}
    
    R->>W: Dequeue task
    W->>H: Generate questions (peut prendre 2-5 min)
    H->>W: Questions générées
    W->>D: Save QCM
    W->>R: Update task status: "completed"
    
    C->>F: GET /api/tasks/abc123
    F->>R: Check task status
    R->>F: Status: completed
    F->>C: 200 OK {status: "completed", qcm_id: 42}
```

**Implémentation:**

```python
# requirements.txt
celery[redis]==5.3.4
redis==5.0.1

# celery_app.py
from celery import Celery
from app import create_app

flask_app = create_app()
celery = Celery(
    flask_app.import_name,
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/1'
)

celery.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=600,  # 10 minutes max
)

# tasks/qcm_tasks.py
from celery_app import celery
from app.services.hugging_face_service import HuggingFaceService

@celery.task(bind=True)
def generate_qcm_async(self, text: str, num_questions: int, enseignant_id: int):
    """Tâche asynchrone pour génération QCM"""
    try:
        # Update progress
        self.update_state(state='PROGRESS', meta={'progress': 0})
        
        # Génération (long processus)
        hf_service = HuggingFaceService()
        questions = hf_service.generate_questions(text, num_questions)
        
        self.update_state(state='PROGRESS', meta={'progress': 50})
        
        # Sauvegarde en base
        from app.models import QCM, Question
        from app.extensions import db
        
        qcm = QCM(titre=f"QCM généré automatiquement", enseignant_id=enseignant_id)
        db.session.add(qcm)
        
        for q_data in questions:
            question = Question(**q_data, qcm=qcm)
            db.session.add(question)
        
        db.session.commit()
        
        self.update_state(state='PROGRESS', meta={'progress': 100})
        
        return {'qcm_id': qcm.id, 'status': 'completed'}
        
    except Exception as e:
        self.update_state(state='FAILURE', meta={'error': str(e)})
        raise

# routes/qcm.py
@bp.route('/generate', methods=['POST'])
@require_role('enseignant', 'admin')
def generate_qcm():
    data = request.json
    
    # Lancer tâche asynchrone
    task = generate_qcm_async.delay(
        text=data['text'],
        num_questions=data.get('num_questions', 10),
        enseignant_id=get_jwt_identity()['user_id']
    )
    
    return jsonify({
        'task_id': task.id,
        'status': 'pending',
        'message': 'Génération en cours...'
    }), 202

@bp.route('/tasks/<task_id>', methods=['GET'])
def get_task_status(task_id):
    task = generate_qcm_async.AsyncResult(task_id)
    
    if task.state == 'PENDING':
        response = {'state': task.state, 'status': 'En attente...'}
    elif task.state == 'PROGRESS':
        response = {
            'state': task.state,
            'progress': task.info.get('progress', 0),
            'status': 'Génération en cours...'
        }
    elif task.state == 'SUCCESS':
        response = {
            'state': task.state,
            'result': task.result,
            'status': 'Complété !'
        }
    else:  # FAILURE
        response = {
            'state': task.state,
            'error': str(task.info),
            'status': 'Erreur lors de la génération'
        }
    
    return jsonify(response)
```

**Démarrage Celery:**
```bash
# Terminal 1: Flask API
python run.py

# Terminal 2: Celery worker
celery -A celery_app.celery worker --loglevel=info --pool=solo

# Terminal 3: Celery monitoring (optionnel)
celery -A celery_app.celery flower
```

#### 🟡 Priorité HAUTE - Court terme (1-3 mois)

##### 4. Migration vers PostgreSQL 15+ avec optimisations

**Nouvelles fonctionnalités:**
```sql
-- 1. Indexes optimisés
CREATE INDEX CONCURRENTLY idx_qcm_enseignant_date 
ON qcms(enseignant_id, date_creation DESC);

CREATE INDEX CONCURRENTLY idx_resultat_etudiant_qcm 
ON resultats(etudiant_id, qcm_id);

-- 2. Full-text search pour recherche contenu
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE qcms ADD COLUMN search_vector tsvector;

CREATE INDEX idx_qcm_search ON qcms USING GIN(search_vector);

CREATE TRIGGER qcm_search_update BEFORE INSERT OR UPDATE
ON qcms FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.french', titre, description);

-- 3. Partitioning pour table resultats (scale)
CREATE TABLE resultats_2025 PARTITION OF resultats
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE resultats_2026 PARTITION OF resultats
FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
```

**Requêtes optimisées:**
```python
# Avant (N+1 queries)
qcms = QCM.query.filter_by(enseignant_id=enseignant_id).all()
for qcm in qcms:
    nb_questions = len(qcm.questions)  # Query supplémentaire !

# Après (1 query avec jointure)
from sqlalchemy import func

qcms = db.session.query(
    QCM,
    func.count(Question.id).label('nb_questions')
).outerjoin(Question).filter(
    QCM.enseignant_id == enseignant_id
).group_by(QCM.id).all()
```

##### 5. Système de Logging Structuré (ELK Stack)

```python
# requirements.txt
python-json-logger==2.0.7
elasticsearch==8.11.0

# shared/logging/config.py
import logging
from pythonjsonlogger import jsonlogger

class CustomJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)
        log_record['timestamp'] = datetime.utcnow().isoformat()
        log_record['level'] = record.levelname
        log_record['logger'] = record.name
        log_record['module'] = record.module

def setup_logging(app):
    handler = logging.StreamHandler()
    formatter = CustomJsonFormatter('%(timestamp)s %(level)s %(name)s %(message)s')
    handler.setFormatter(formatter)
    
    app.logger.addHandler(handler)
    app.logger.setLevel(logging.INFO)
    
    # Elasticsearch handler (optionnel)
    if app.config.get('ELASTICSEARCH_URL'):
        from elasticsearch import Elasticsearch
        es = Elasticsearch([app.config['ELASTICSEARCH_URL']])
        # Configure elasticsearch handler...

# Utilisation
app.logger.info('QCM généré', extra={
    'qcm_id': qcm.id,
    'enseignant_id': enseignant_id,
    'nb_questions': len(questions),
    'duration_seconds': generation_time
})
```

##### 6. API Versioning

```python
# Avant (pas de versioning)
@app.route('/api/qcm')

# Après
@app.route('/api/v1/qcm')
@app.route('/api/v2/qcm')  # Nouvelle version avec breaking changes

# Structure
app/
  api/
    v1/
      routes/
        qcm.py
    v2/
      routes/
        qcm.py  # Nouvelle implémentation
```

### 7.2 Améliorations IA / Machine Learning

#### 🔴 Priorité CRITIQUE

##### 1. Fine-tuning des Modèles sur Données Pédagogiques

**Problème actuel:** Modèles génériques (pas adaptés au contexte éducatif)

**Solution:**
```python
# scripts/finetune_model.py
from transformers import (
    T5ForConditionalGeneration,
    T5Tokenizer,
    Trainer,
    TrainingArguments
)
from datasets import load_dataset

# 1. Préparer dataset pédagogique
# Format: contexte -> question + options
dataset = load_dataset('json', data_files={
    'train': 'data/questions_train.json',
    'validation': 'data/questions_val.json'
})

# Exemple de données
# {
#   "context": "Python est un langage de programmation...",
#   "question": "Quel est le type de Python ?",
#   "options": ["Compilé", "Interprété", "Assembleur", "Binaire"],
#   "answer": "Interprété"
# }

# 2. Tokenization
model_name = "t5-base"
tokenizer = T5Tokenizer.from_pretrained(model_name)
model = T5ForConditionalGeneration.from_pretrained(model_name)

def preprocess_function(examples):
    inputs = [f"generate question: {ctx}" for ctx in examples["context"]]
    targets = [q for q in examples["question"]]
    
    model_inputs = tokenizer(inputs, max_length=512, truncation=True, padding="max_length")
    labels = tokenizer(targets, max_length=128, truncation=True, padding="max_length")
    
    model_inputs["labels"] = labels["input_ids"]
    return model_inputs

tokenized_dataset = dataset.map(preprocess_function, batched=True)

# 3. Training
training_args = TrainingArguments(
    output_dir="./models/t5-qcm-generator",
    evaluation_strategy="epoch",
    learning_rate=5e-5,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    num_train_epochs=3,
    weight_decay=0.01,
    save_total_limit=2,
    push_to_hub=False,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset["train"],
    eval_dataset=tokenized_dataset["validation"],
)

trainer.train()

# 4. Sauvegarder modèle fine-tuné
model.save_pretrained("./models/t5-qcm-generator-finetuned")
tokenizer.save_pretrained("./models/t5-qcm-generator-finetuned")
```

**Impact attendu:**
- ✅ +40% précision génération questions
- ✅ -60% questions non pertinentes
- ✅ Meilleure adaptation au vocabulaire académique

##### 2. Intégration LangChain pour pipelines IA avancés

```python
# requirements.txt
langchain==0.1.0
langchain-community==0.0.12
chromadb==0.4.18

# services/langchain_service.py
from langchain.chains import RetrievalQA
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.llms import HuggingFacePipeline
from transformers import pipeline

class LangChainQCMService:
    def __init__(self):
        # 1. Setup embeddings
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        # 2. Setup LLM
        model_id = "google/flan-t5-base"
        pipe = pipeline(
            "text2text-generation",
            model=model_id,
            max_length=512,
            temperature=0.7,
        )
        self.llm = HuggingFacePipeline(pipeline=pipe)
        
        # 3. Vector store
        self.vectorstore = None
    
    def create_qcm_from_document(self, document_text: str, num_questions: int = 10):
        """Pipeline complet de génération"""
        
        # 1. Split en chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        texts = text_splitter.split_text(document_text)
        
        # 2. Créer vector store
        self.vectorstore = Chroma.from_texts(
            texts=texts,
            embedding=self.embeddings,
            persist_directory="./chroma_db"
        )
        
        # 3. Retrieval QA chain
        qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=self.vectorstore.as_retriever(search_kwargs={"k": 3}),
        )
        
        # 4. Générer questions
        questions = []
        for i in range(num_questions):
            prompt = f"""
            Basé sur le contexte fourni, génère une question de QCM avec 4 options.
            Format JSON:
            {{
                "question": "...",
                "options": ["A", "B", "C", "D"],
                "correct_answer": "B",
                "explanation": "..."
            }}
            """
            
            result = qa_chain.run(prompt)
            questions.append(self._parse_question(result))
        
        return questions
    
    def evaluate_answer_semantic(self, student_answer: str, correct_answer: str, context: str):
        """Évaluation sémantique avancée"""
        qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            retriever=self.vectorstore.as_retriever()
        )
        
        prompt = f"""
        Contexte: {context}
        Réponse attendue: {correct_answer}
        Réponse étudiant: {student_answer}
        
        Évalue la réponse de l'étudiant sur 100 et donne un feedback constructif.
        Format JSON:
        {{
            "score": 0-100,
            "feedback": "...",
            "points_corrects": [...],
            "points_manquants": [...]
        }}
        """
        
        result = qa_chain.run(prompt)
        return self._parse_evaluation(result)
```

**Avantages LangChain:**
- ✅ RAG (Retrieval Augmented Generation) pour réponses contextualisées
- ✅ Vector store pour recherche sémantique
- ✅ Chaînage d'opérations complexes
- ✅ Mémoire conversationnelle

##### 3. Système d'A/B Testing pour Modèles IA

```python
# core/ab_testing.py
import random
from enum import Enum

class ModelVariant(Enum):
    MODEL_A = "t5-base"          # Modèle actuel
    MODEL_B = "t5-base-finetuned"  # Nouveau modèle fine-tuné
    MODEL_C = "langchain-rag"    # LangChain avec RAG

class ABTestingService:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.variants = {
            ModelVariant.MODEL_A: 50,  # 50% trafic
            ModelVariant.MODEL_B: 30,  # 30% trafic
            ModelVariant.MODEL_C: 20,  # 20% trafic
        }
    
    def get_variant_for_user(self, user_id: int) -> ModelVariant:
        """Assigne variante de manière consistente"""
        cache_key = f"ab_test:user:{user_id}"
        
        # Check cache
        cached = self.redis.get(cache_key)
        if cached:
            return ModelVariant(cached)
        
        # Assigner nouvelle variante
        rand = random.randint(1, 100)
        cumulative = 0
        
        for variant, percentage in self.variants.items():
            cumulative += percentage
            if rand <= cumulative:
                self.redis.set(cache_key, variant.value, ex=86400 * 30)  # 30 jours
                return variant
        
        return ModelVariant.MODEL_A
    
    def log_metric(self, user_id: int, metric_name: str, value: float):
        """Enregistre métriques pour analyse"""
        variant = self.get_variant_for_user(user_id)
        key = f"ab_test:metrics:{variant.value}:{metric_name}"
        
        self.redis.lpush(key, value)
        self.redis.expire(key, 86400 * 30)

# Utilisation
@bp.route('/generate', methods=['POST'])
def generate_qcm():
    user_id = get_jwt_identity()['user_id']
    variant = ab_testing.get_variant_for_user(user_id)
    
    start_time = time.time()
    
    if variant == ModelVariant.MODEL_A:
        result = hf_service_v1.generate(data)
    elif variant == ModelVariant.MODEL_B:
        result = hf_service_v2.generate(data)
    else:
        result = langchain_service.generate(data)
    
    duration = time.time() - start_time
    
    # Log métriques
    ab_testing.log_metric(user_id, 'generation_time', duration)
    ab_testing.log_metric(user_id, 'num_questions', len(result))
    
    return jsonify(result)
```

### 7.3 Améliorations Frontend

#### 🔴 Priorité CRITIQUE

##### 1. Migration complète vers Next.js 15+ (déjà détaillée dans SPECIFICATIONS_NEXTJS.md)

##### 2. Implémentation React Query pour State Management

```typescript
// core/providers/QueryProvider.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        cacheTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }))
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

// features/qcm/hooks/useQCMList.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qcmService } from '@/shared/services/api/qcm.service'

export function useQCMList(enseignantId: string) {
  return useQuery({
    queryKey: ['qcms', enseignantId],
    queryFn: () => qcmService.getByEnseignant(enseignantId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useCreateQCM() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: qcmService.create,
    onSuccess: () => {
      // Invalider cache pour recharger liste
      queryClient.invalidateQueries({ queryKey: ['qcms'] })
    },
  })
}

// Utilisation dans composant
export function QCMList() {
  const { data: qcms, isLoading, error } = useQCMList(enseignantId)
  const createQCM = useCreateQCM()
  
  if (isLoading) return <LoadingSkeleton />
  if (error) return <ErrorMessage error={error} />
  
  return (
    <div>
      {qcms.map(qcm => <QCMCard key={qcm.id} qcm={qcm} />)}
      <Button onClick={() => createQCM.mutate(newQCMData)}>
        Créer QCM
      </Button>
    </div>
  )
}
```

##### 3. Progressive Web App (PWA)

```typescript
// next.config.mjs
import withPWA from 'next-pwa'

const config = {
  // ... autres configs
}

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(config)

// public/manifest.json
{
  "name": "Système Intelligent - Examens",
  "short_name": "SmartExam",
  "description": "Plateforme de génération et correction automatique d'examens",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Fonctionnalités offline:**
- ✅ Cache des examens téléchargés
- ✅ Mode hors ligne pour consultation résultats
- ✅ Synchronisation automatique à reconnexion

##### 4. Système de Notifications Temps Réel (WebSocket)

```typescript
// Backend Flask - Socket.IO
# requirements.txt
flask-socketio==5.3.5
python-socketio==5.10.0

# app/extensions.py
from flask_socketio import SocketIO

socketio = SocketIO(cors_allowed_origins="*")

# app/__init__.py
def create_app():
    # ...
    socketio.init_app(app)
    return app

# events/notifications.py
from app.extensions import socketio
from flask_socketio import emit, join_room

@socketio.on('connect')
def handle_connect():
    print('Client connecté')

@socketio.on('join_room')
def handle_join_room(data):
    room = f"user_{data['user_id']}"
    join_room(room)
    emit('joined', {'room': room})

def notify_qcm_generated(user_id: int, qcm_id: int):
    """Notifier fin de génération QCM"""
    socketio.emit('qcm_generated', {
        'qcm_id': qcm_id,
        'message': 'Votre QCM a été généré avec succès !',
        'timestamp': datetime.utcnow().isoformat()
    }, room=f"user_{user_id}")

def notify_new_exam(etudiant_ids: list, qcm_id: int):
    """Notifier nouveaux examens disponibles"""
    for etudiant_id in etudiant_ids:
        socketio.emit('new_exam', {
            'qcm_id': qcm_id,
            'message': 'Nouveau QCM disponible !'
        }, room=f"user_{etudiant_id}")

// Frontend Next.js
# package.json
"dependencies": {
  "socket.io-client": "^4.6.0"
}

// shared/services/socket.service.ts
import { io, Socket } from 'socket.io-client'

class SocketService {
  private socket: Socket | null = null
  
  connect(userId: string) {
    this.socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000', {
      transports: ['websocket'],
    })
    
    this.socket.on('connect', () => {
      console.log('WebSocket connecté')
      this.socket?.emit('join_room', { user_id: userId })
    })
    
    return this.socket
  }
  
  onQCMGenerated(callback: (data: any) => void) {
    this.socket?.on('qcm_generated', callback)
  }
  
  onNewExam(callback: (data: any) => void) {
    this.socket?.on('new_exam', callback)
  }
  
  disconnect() {
    this.socket?.disconnect()
  }
}

export const socketService = new SocketService()

// features/auth/hooks/useSocket.ts
'use client'

import { useEffect } from 'react'
import { socketService } from '@/shared/services/socket.service'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

export function useSocket() {
  const { user } = useAuth()
  
  useEffect(() => {
    if (!user) return
    
    const socket = socketService.connect(user.id)
    
    socketService.onQCMGenerated((data) => {
      toast.success(data.message, {
        action: {
          label: 'Voir',
          onClick: () => router.push(`/enseignant/qcm/${data.qcm_id}`)
        }
      })
    })
    
    socketService.onNewExam((data) => {
      toast.info(data.message, {
        action: {
          label: 'Voir',
          onClick: () => router.push(`/etudiant/examens/${data.qcm_id}`)
        }
      })
    })
    
    return () => socketService.disconnect()
  }, [user])
}
```

### 7.4 Améliorations Sécurité

#### 🔴 Priorité CRITIQUE

##### 1. Implémentation CSRF Protection

```python
# requirements.txt
flask-wtf==1.2.1

# app/__init__.py
from flask_wtf.csrf import CSRFProtect

csrf = CSRFProtect()

def create_app():
    # ...
    csrf.init_app(app)
    
    # Exemptions pour API (protégé par JWT)
    csrf.exempt(api_blueprint)
    
    return app
```

##### 2. Content Security Policy (CSP)

```python
# shared/middleware/security_headers.py
from flask import Flask

def add_security_headers(app: Flask):
    @app.after_request
    def set_security_headers(response):
        response.headers['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://api.huggingface.co"
        )
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        return response
```

##### 3. Input Validation & Sanitization

```python
# shared/validators.py
import bleach
from marshmallow import ValidationError

ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li']
ALLOWED_ATTRIBUTES = {}

def sanitize_html(html: str) -> str:
    """Nettoyer HTML des tags dangereux"""
    return bleach.clean(html, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True)

def validate_file_upload(file):
    """Valider upload fichier"""
    ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'}
    MAX_SIZE = 10 * 1024 * 1024  # 10 MB
    
    # Check extension
    if not file.filename:
        raise ValidationError("Nom de fichier manquant")
    
    ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(f"Extension non autorisée. Autorisées: {', '.join(ALLOWED_EXTENSIONS)}")
    
    # Check size
    file.seek(0, 2)  # Aller à la fin
    size = file.tell()
    file.seek(0)  # Revenir au début
    
    if size > MAX_SIZE:
        raise ValidationError(f"Fichier trop volumineux. Max: {MAX_SIZE / 1024 / 1024} MB")
    
    # Check MIME type
    import magic
    mime = magic.from_buffer(file.read(1024), mime=True)
    file.seek(0)
    
    ALLOWED_MIMES = {'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'}
    if mime not in ALLOWED_MIMES:
        raise ValidationError("Type MIME non autorisé")
    
    return True
```

### 7.5 Améliorations Infrastructure

#### 🟡 Priorité HAUTE

##### 1. Docker Compose Multi-Services

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: smart-system-db
    environment:
      POSTGRES_DB: systeme_intelligent
      POSTGRES_USER: smart_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U smart_user"]
      interval: 10s
      timeout: 5s
      retries: 5
  
  # Redis Cache & Queue
  redis:
    image: redis:7-alpine
    container_name: smart-system-redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
  
  # Flask Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: smart-system-backend
    environment:
      DATABASE_URL: postgresql://smart_user:${DB_PASSWORD}@postgres:5432/systeme_intelligent
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
      SECRET_KEY: ${SECRET_KEY}
      JWT_SECRET_KEY: ${JWT_SECRET_KEY}
      HF_API_TOKEN: ${HF_API_TOKEN}
      FLASK_ENV: production
    volumes:
      - ./backend:/app
      - backend_uploads:/app/uploads
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: gunicorn --bind 0.0.0.0:5000 --workers 4 --timeout 300 run:app
  
  # Celery Worker (IA tasks)
  celery_worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: smart-system-celery
    environment:
      DATABASE_URL: postgresql://smart_user:${DB_PASSWORD}@postgres:5432/systeme_intelligent
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
      HF_API_TOKEN: ${HF_API_TOKEN}
    volumes:
      - ./backend:/app
    depends_on:
      - redis
      - postgres
    command: celery -A celery_app.celery worker --loglevel=info --concurrency=2
  
  # Celery Beat (scheduled tasks)
  celery_beat:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: smart-system-celery-beat
    environment:
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
    volumes:
      - ./backend:/app
    depends_on:
      - redis
    command: celery -A celery_app.celery beat --loglevel=info
  
  # Next.js Frontend
  frontend:
    build:
      context: ./frontend-nextjs
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
    container_name: smart-system-frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_URL: http://backend:5000
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
  
  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: smart-system-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  redis_data:
  backend_uploads:
```

##### 2. CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # Test Backend
  test-backend:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.13'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install -r requirements-dev.txt
      
      - name: Run tests
        run: |
          cd backend
          pytest --cov=app --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./backend/coverage.xml
  
  # Test Frontend
  test-frontend:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd frontend-nextjs
          npm ci
      
      - name: Run linter
        run: |
          cd frontend-nextjs
          npm run lint
      
      - name: Run tests
        run: |
          cd frontend-nextjs
          npm run test
      
      - name: Build
        run: |
          cd frontend-nextjs
          npm run build
  
  # Deploy to Production
  deploy:
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/smart-system
            git pull origin main
            docker-compose down
            docker-compose up -d --build
            docker-compose exec backend flask db upgrade
```

---

*Suite dans le fichier suivant: DEPLOIEMENT_MONITORING.md*


