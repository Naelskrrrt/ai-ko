"""
Service IA pour la génération de questions de QCM
Utilise l'API Hugging Face Inference avec des modèles open-source
"""
import os
import json
import logging
import re
from typing import List, Dict, Any, Optional
import requests

logger = logging.getLogger(__name__)


class AIService:
    """Service pour générer des questions de QCM avec l'IA"""

    def __init__(self):
        self.api_token = os.getenv('HF_API_TOKEN')
        if not self.api_token:
            logger.warning(
                "HF_API_TOKEN non défini. La génération IA ne fonctionnera pas.")
            # Log de diagnostic pour aider au débogage
            logger.debug(
                f"Variables d'environnement disponibles: {[k for k in os.environ.keys() if 'HF' in k or 'TOKEN' in k]}")
        else:
            # Masquer le token dans les logs (afficher seulement les 4 premiers et 4 derniers caractères)
            token_preview = f"{self.api_token[:4]}...{self.api_token[-4:]}" if len(
                self.api_token) > 8 else "***"
            logger.info(f"HF_API_TOKEN chargé: {token_preview}")

        # Modèle à utiliser (configurable via variable d'environnement)
        # Modèles alternatifs disponibles:
        # - mistralai/Mistral-7B-Instruct-v0.2
        # - meta-llama/Llama-3.2-3B-Instruct
        # - microsoft/Phi-3-mini-4k-instruct
        # - Qwen/Qwen2.5-1.5B-Instruct
        self.model = os.getenv(
            'HF_MODEL', "meta-llama/Llama-3.2-3B-Instruct")
        # Liste des modèles de fallback (sans le modèle principal pour éviter les doublons)
        # Modèles compatibles avec router.huggingface.co/v1/chat/completions
        all_fallbacks = [
            "meta-llama/Llama-3.2-3B-Instruct",
            "meta-llama/Llama-3.1-8B-Instruct",
            "Qwen/Qwen2.5-72B-Instruct",
            "mistralai/Mistral-Nemo-Instruct-2407"
        ]
        # Exclure le modèle principal de la liste de fallback
        self.fallback_models = [m for m in all_fallbacks if m != self.model]

        # Utiliser la nouvelle API Inference Providers (router.huggingface.co)
        # qui est plus stable et supporte mieux les modèles instruct
        # Format: https://router.huggingface.co/v1/chat/completions pour chat
        # ou https://api-inference.huggingface.co/models/{model} pour text generation
        self.use_chat_api = os.getenv(
            'HF_USE_CHAT_API', 'true').lower() in ('true', '1', 'yes')
        if self.use_chat_api:
            # Utiliser l'API Chat Completions (OpenAI-compatible) - plus stable
            self.api_url = "https://router.huggingface.co/v1/chat/completions"
        else:
            # Ancienne API (peut être moins stable)
            self.api_url = f"https://api-inference.huggingface.co/models/{self.model}"

        # Configuration
        self.max_retries = 3
        self.timeout = 60

    def _build_prompt(self, text: str, num_questions: int, matiere: Optional[str] = None,
                      niveau: Optional[str] = None, mention: Optional[str] = None,
                      parcours: Optional[str] = None) -> str:
        """
        Construit le prompt pour le modèle IA (format texte pour l'ancienne API)
        """
        """
        Construit le prompt pour le modèle IA

        Args:
            text: Texte source pour générer les questions
            num_questions: Nombre de questions à générer
            matiere: Matière concernée (optionnel)
            niveau: Niveau académique (L1, L2, L3, M1, M2) (optionnel)
            mention: Mention académique (optionnel)
            parcours: Parcours académique (optionnel)

        Returns:
            Prompt formaté pour le modèle
        """
        context_parts = []
        if matiere:
            context_parts.append(f"Matière: {matiere}")
        if niveau:
            context_parts.append(f"Niveau: {niveau}")
        if mention:
            context_parts.append(f"Mention: {mention}")
        if parcours:
            context_parts.append(f"Parcours: {parcours}")

        context = " - ".join(context_parts) if context_parts else "Contexte général"

        prompt = f"""Tu es un expert en création de questionnaires à choix multiples (QCM).
Ta tâche est de générer {num_questions} questions de haute qualité à partir du texte fourni.

{context}

Texte source:
{text}

Génère exactement {num_questions} questions au format JSON suivant:
{{
  "questions": [
    {{
      "enonce": "Énoncé de la question?",
      "type": "qcm",
      "options": [
        {{"texte": "Option A", "estCorrecte": false}},
        {{"texte": "Option B", "estCorrecte": true}},
        {{"texte": "Option C", "estCorrecte": false}},
        {{"texte": "Option D", "estCorrecte": false}}
      ],
      "explication": "Explication de la réponse correcte",
      "points": 1
    }}
  ]
}}

Règles importantes:
1. Chaque question doit avoir EXACTEMENT 4 options
2. Une seule option doit être correcte (estCorrecte: true)
3. Les questions doivent être claires et non ambiguës
4. Les options incorrectes doivent être plausibles
5. L'explication doit être concise et pédagogique
6. Génère UNIQUEMENT le JSON, sans texte avant ou après
7. Le JSON doit être valide et bien formaté

Génère maintenant les {num_questions} questions:"""

        return prompt

    def _build_chat_messages(self, text: str, num_questions: int, matiere: Optional[str] = None,
                             niveau: Optional[str] = None, mention: Optional[str] = None,
                             parcours: Optional[str] = None) -> list:
        """
        Construit les messages pour l'API Chat Completions (format conversationnel)
        """
        context_parts = []
        if matiere:
            context_parts.append(f"Matière: {matiere}")
        if niveau:
            context_parts.append(f"Niveau: {niveau}")
        if mention:
            context_parts.append(f"Mention: {mention}")
        if parcours:
            context_parts.append(f"Parcours: {parcours}")

        context = " - ".join(context_parts) if context_parts else "Contexte général"

        system_message = """Tu es un expert en création de questionnaires à choix multiples (QCM).
Ta tâche est de générer des questions de haute qualité à partir du texte fourni.
Génère UNIQUEMENT du JSON valide, sans texte avant ou après."""

        user_prompt = f"""Génère exactement {num_questions} questions de QCM à partir du texte suivant.

{context}

Texte source:
{text}

Format JSON attendu:
{{
  "questions": [
    {{
      "enonce": "Énoncé de la question?",
      "type": "qcm",
      "options": [
        {{"texte": "Option A", "estCorrecte": false}},
        {{"texte": "Option B", "estCorrecte": true}},
        {{"texte": "Option C", "estCorrecte": false}},
        {{"texte": "Option D", "estCorrecte": false}}
      ],
      "explication": "Explication de la réponse correcte",
      "points": 1
    }}
  ]
}}

Règles importantes:
1. Chaque question doit avoir EXACTEMENT 4 options
2. Une seule option doit être correcte (estCorrecte: true)
3. Les questions doivent être claires et non ambiguës
4. Les options incorrectes doivent être plausibles
5. L'explication doit être concise et pédagogique
6. Génère UNIQUEMENT le JSON, sans texte avant ou après
7. Le JSON doit être valide et bien formaté

Génère maintenant les {num_questions} questions:"""

        return [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_prompt}
        ]

    def _call_huggingface_api_with_messages(self, messages: list, model_override: Optional[str] = None, num_questions: int = 10) -> str:
        """
        Appelle l'API Chat Completions avec des messages (format conversationnel)

        Args:
            messages: Liste de messages au format conversationnel
            model_override: Modèle à utiliser (pour fallback)
            num_questions: Nombre de questions à générer (pour calculer max_tokens)
        """
        if not self.api_token:
            raise ValueError(
                "HF_API_TOKEN n'est pas configuré. "
                "Définissez la variable d'environnement HF_API_TOKEN avec votre token Hugging Face. "
                "Obtenez un token sur: https://huggingface.co/settings/tokens"
            )

        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }

        # Calculer max_tokens en fonction du nombre de questions
        # Environ 200 tokens par question (énoncé + 4 options + explication)
        estimated_tokens = num_questions * 200 + 100  # +100 pour le format JSON
        max_tokens = min(max(estimated_tokens, 1024),
                         4096)  # Entre 1024 et 4096

        logger.debug(
            f"max_tokens calculé: {max_tokens} pour {num_questions} questions")

        payload = {
            "model": model_override or self.model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.7,
            "top_p": 0.9
        }

        # Liste des modèles à essayer
        models_to_try = [model_override] if model_override else [self.model]
        if self.model not in models_to_try:
            models_to_try = [self.model] + \
                [m for m in self.fallback_models if m != self.model]
        else:
            models_to_try.extend(
                [m for m in self.fallback_models if m != self.model and m not in models_to_try])

        last_error = None

        for model_name in models_to_try:
            payload["model"] = model_name
            logger.info(f"Tentative avec le modèle: {model_name} (API Chat)")

            for attempt in range(self.max_retries):
                try:
                    logger.info(
                        f"Appel API Hugging Face Chat - Modèle: {model_name} (tentative {attempt + 1}/{self.max_retries})")

                    response = requests.post(
                        self.api_url,
                        headers=headers,
                        json=payload,
                        timeout=self.timeout
                    )

                    if response.status_code == 503:
                        logger.warning(
                            f"Modèle {model_name} en chargement. Tentative {attempt + 1}/{self.max_retries}")
                        if attempt < self.max_retries - 1:
                            import time
                            time.sleep(10)
                            continue
                        else:
                            logger.warning(
                                f"Modèle {model_name} met trop de temps à charger, passage au suivant...")
                            last_error = f"Le modèle {model_name} met trop de temps à charger"
                            break

                    if response.status_code == 410:
                        logger.warning(
                            f"Modèle {model_name} non disponible (410 Gone), passage au suivant...")
                        last_error = f"Le modèle {model_name} n'est plus disponible"
                        break

                    response.raise_for_status()

                    result = response.json()

                    # Format de réponse Chat Completions
                    if isinstance(result, dict) and 'choices' in result:
                        if len(result['choices']) > 0:
                            generated_text = result['choices'][0].get(
                                'message', {}).get('content', '')
                        else:
                            generated_text = ''
                    else:
                        generated_text = str(result)

                    logger.info(
                        f"Réponse générée avec {model_name}: {len(generated_text)} caractères")
                    if model_name != self.model:
                        logger.info(
                            f"Modèle de fallback {model_name} utilisé avec succès")
                        self.model = model_name
                    return generated_text

                except requests.exceptions.Timeout:
                    logger.error(
                        f"Timeout avec le modèle {model_name} (tentative {attempt + 1})")
                    if attempt < self.max_retries - 1:
                        continue
                    last_error = f"Timeout avec le modèle {model_name}"
                    break

                except requests.exceptions.HTTPError as e:
                    if e.response and e.response.status_code == 410:
                        logger.warning(
                            f"Modèle {model_name} non disponible (410), passage au suivant...")
                        last_error = f"Le modèle {model_name} n'est plus disponible"
                        break
                    else:
                        logger.error(f"Erreur HTTP avec {model_name}: {e}")
                        if attempt < self.max_retries - 1:
                            continue
                        last_error = f"Erreur HTTP avec {model_name}: {str(e)}"
                        break

                except Exception as e:
                    logger.error(f"Erreur avec le modèle {model_name}: {e}")
                    if attempt < self.max_retries - 1:
                        continue
                    last_error = f"Erreur avec {model_name}: {str(e)}"
                    break

        # Tous les modèles ont échoué
        error_msg = (
            f"Impossible de générer les questions. Tous les modèles ont échoué. "
            f"Dernière erreur: {last_error}. "
            f"Veuillez vérifier votre token HF_API_TOKEN et votre connexion internet."
        )
        logger.error(error_msg)
        raise Exception(error_msg)

    def _call_huggingface_api(self, prompt: str, model_override: Optional[str] = None) -> str:
        """
        Appelle l'API Hugging Face Inference avec fallback automatique

        Args:
            prompt: Prompt à envoyer au modèle
            model_override: Modèle à utiliser (pour fallback)

        Returns:
            Réponse générée par le modèle
        """
        if not self.api_token:
            raise ValueError(
                "HF_API_TOKEN n'est pas configuré. "
                "Définissez la variable d'environnement HF_API_TOKEN avec votre token Hugging Face. "
                "Obtenez un token sur: https://huggingface.co/settings/tokens"
            )

        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }

        # Utiliser l'API Chat Completions si activée
        if self.use_chat_api:
            # Construire les messages pour l'API chat
            messages = self._build_chat_messages(
                prompt,  # Le prompt est en fait le texte source ici
                num_questions=10,  # Sera ajusté dans generate_questions
                matiere=None,
                niveau=None
            )

            payload = {
                "model": model_override or self.model,
                "messages": messages,
                "max_tokens": 2048,
                "temperature": 0.7,
                "top_p": 0.9
            }
        else:
            # Ancienne API text generation
            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": 2048,
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "do_sample": True,
                    "return_full_text": False
                }
            }

        # Liste des modèles à essayer (modèle principal + fallbacks)
        models_to_try = [model_override] if model_override else [self.model]
        if self.model not in models_to_try:
            models_to_try = [self.model] + \
                [m for m in self.fallback_models if m != self.model]
        else:
            models_to_try.extend(
                [m for m in self.fallback_models if m != self.model and m not in models_to_try])

        last_error = None

        for model_name in models_to_try:
            api_url = f"https://api-inference.huggingface.co/models/{model_name}"
            logger.info(f"Tentative avec le modèle: {model_name}")

            for attempt in range(self.max_retries):
                try:
                    logger.info(
                        f"Appel API Hugging Face - Modèle: {model_name} (tentative {attempt + 1}/{self.max_retries})")

                    response = requests.post(
                        api_url,
                        headers=headers,
                        json=payload,
                        timeout=self.timeout
                    )

                    if response.status_code == 503:
                        # Modèle en cours de chargement
                        logger.warning(
                            f"Modèle {model_name} en chargement. Tentative {attempt + 1}/{self.max_retries}")
                        if attempt < self.max_retries - 1:
                            import time
                            time.sleep(10)  # Attendre 10 secondes
                            continue
                        else:
                            # Passer au modèle suivant
                            logger.warning(
                                f"Modèle {model_name} met trop de temps à charger, passage au suivant...")
                            last_error = f"Le modèle {model_name} met trop de temps à charger"
                            break

                    if response.status_code == 410:
                        # Modèle non disponible (Gone) - essayer le suivant
                        logger.warning(
                            f"Modèle {model_name} non disponible (410 Gone), passage au suivant...")
                        last_error = f"Le modèle {model_name} n'est plus disponible"
                        break

                    response.raise_for_status()

                    result = response.json()

                    # Extraire le texte généré selon le type d'API
                    if self.use_chat_api:
                        # Format de réponse Chat Completions (OpenAI-compatible)
                        if isinstance(result, dict) and 'choices' in result:
                            if len(result['choices']) > 0:
                                generated_text = result['choices'][0].get(
                                    'message', {}).get('content', '')
                            else:
                                generated_text = ''
                        else:
                            generated_text = str(result)
                    else:
                        # Format de réponse ancienne API
                        if isinstance(result, list) and len(result) > 0:
                            generated_text = result[0].get(
                                'generated_text', '')
                        elif isinstance(result, dict):
                            generated_text = result.get('generated_text', '')
                        else:
                            generated_text = str(result)

                    logger.info(
                        f"Réponse générée avec {model_name}: {len(generated_text)} caractères")
                    # Mettre à jour le modèle utilisé si c'était un fallback
                    if model_name != self.model:
                        logger.info(
                            f"Modèle de fallback {model_name} utilisé avec succès")
                        self.model = model_name
                        self.api_url = api_url
                    return generated_text

                except requests.exceptions.Timeout:
                    logger.error(
                        f"Timeout avec le modèle {model_name} (tentative {attempt + 1})")
                    if attempt < self.max_retries - 1:
                        continue
                    last_error = f"Timeout avec le modèle {model_name}"
                    break

                except requests.exceptions.HTTPError as e:
                    if e.response and e.response.status_code == 410:
                        # Erreur 410 - essayer le modèle suivant
                        logger.warning(
                            f"Modèle {model_name} non disponible (410), passage au suivant...")
                        last_error = f"Le modèle {model_name} n'est plus disponible"
                        break
                    else:
                        logger.error(f"Erreur HTTP avec {model_name}: {e}")
                        if attempt < self.max_retries - 1:
                            continue
                        last_error = f"Erreur HTTP avec {model_name}: {str(e)}"
                        break

                except Exception as e:
                    logger.error(f"Erreur avec le modèle {model_name}: {e}")
                    if attempt < self.max_retries - 1:
                        continue
                    last_error = f"Erreur avec {model_name}: {str(e)}"
                    break

        # Tous les modèles ont échoué
        error_msg = (
            f"Impossible de générer les questions. Tous les modèles ont échoué. "
            f"Dernière erreur: {last_error}. "
            f"Veuillez vérifier votre token HF_API_TOKEN et votre connexion internet."
        )
        logger.error(error_msg)
        raise Exception(error_msg)

    def _extract_json_from_response(self, response_text: str) -> Dict[str, Any]:
        """
        Extrait le JSON de la réponse du modèle avec gestion des JSON incomplets

        Args:
            response_text: Texte généré par le modèle

        Returns:
            Dictionnaire Python parsé depuis le JSON
        """
        # Essayer de trouver un bloc JSON dans la réponse
        # Chercher entre ``` ou directement un objet JSON

        # Pattern 1: JSON entre backticks
        json_match = re.search(
            r'```json\s*(\{.*?\})\s*```', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            # Pattern 2: JSON direct - chercher depuis le début jusqu'à la fin
            json_match = re.search(
                r'\{.*"questions".*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
            else:
                # Essayer de parser le texte complet comme JSON
                json_str = response_text.strip()

        # Essayer de parser le JSON
        try:
            data = json.loads(json_str)
            return data
        except json.JSONDecodeError as e:
            logger.warning(f"Erreur parsing JSON complet: {e}")
            logger.info("Tentative de réparation du JSON incomplet...")

            # Essayer de réparer le JSON incomplet en extrayant les questions valides
            try:
                # Méthode 1: Chercher toutes les questions complètes avec regex
                # Pattern pour trouver chaque question complète (plus permissif)
                questions_list = []

                # Chercher le début du tableau questions
                questions_start = json_str.find('"questions"')
                if questions_start == -1:
                    questions_start = json_str.find('questions')

                if questions_start != -1:
                    # Extraire la partie après "questions"
                    questions_section = json_str[questions_start:]
                    # Chercher le début du tableau [
                    array_start = questions_section.find('[')
                    if array_start != -1:
                        questions_section = questions_section[array_start:]

                # Pattern pour trouver chaque question (plus flexible)
                # Chercher les blocs qui commencent par { et contiennent enonce, options, etc.
                question_pattern = r'\{\s*"enonce"\s*:\s*"((?:[^"\\]|\\.)*)"[^}]*"type"\s*:\s*"[^"]*"[^}]*"options"\s*:\s*\[(.*?)\][^}]*"explication"\s*:\s*"((?:[^"\\]|\\.)*)"[^}]*"points"\s*:\s*(\d+)'
                question_matches = re.finditer(
                    question_pattern, questions_section or json_str, re.DOTALL)

                for match in question_matches:
                    try:
                        enonce = match.group(1).replace(
                            '\\"', '"').replace('\\n', '\n')
                        options_str = match.group(2)
                        explication = match.group(3).replace(
                            '\\"', '"').replace('\\n', '\n')
                        points = int(match.group(4))

                        # Parser les options
                        options = []
                        option_pattern = r'\{\s*"texte"\s*:\s*"((?:[^"\\]|\\.)*)"[^}]*"estCorrecte"\s*:\s*(true|false)'
                        option_matches = re.finditer(
                            option_pattern, options_str, re.DOTALL)

                        for opt_match in option_matches:
                            texte = opt_match.group(1).replace(
                                '\\"', '"').replace('\\n', '\n')
                            est_correcte = opt_match.group(2) == 'true'
                            options.append({
                                "texte": texte,
                                "estCorrecte": est_correcte
                            })

                        # Vérifier qu'on a au moins 2 options
                        if len(options) >= 2:
                            questions_list.append({
                                "enonce": enonce,
                                "type": "qcm",
                                "options": options,
                                "explication": explication,
                                "points": points
                            })
                    except Exception as q_error:
                        logger.debug(
                            f"Erreur lors de l'extraction d'une question: {q_error}")
                        continue

                if questions_list:
                    logger.info(
                        f"Extraction réussie: {len(questions_list)} questions valides extraites du JSON incomplet")
                    return {"questions": questions_list}

                # Méthode 2: Essayer de fermer le JSON manuellement
                # Chercher la dernière accolade fermante valide
                brace_count = 0
                last_valid_pos = -1
                for i, char in enumerate(json_str):
                    if char == '{':
                        brace_count += 1
                    elif char == '}':
                        brace_count -= 1
                        if brace_count == 1:  # On est dans l'objet racine
                            last_valid_pos = i

                if last_valid_pos > 0:
                    # Essayer de parser jusqu'à la dernière position valide
                    truncated_json = json_str[:last_valid_pos + 1]
                    # Fermer les balises manquantes
                    if truncated_json.count('[') > truncated_json.count(']'):
                        truncated_json += ']'
                    if truncated_json.count('{') > truncated_json.count('}'):
                        truncated_json += '}'

                    try:
                        data = json.loads(truncated_json)
                        logger.info(
                            f"JSON réparé en tronquant: {len(data.get('questions', []))} questions")
                        return data
                    except json.JSONDecodeError:
                        pass

            except Exception as repair_error:
                logger.warning(
                    f"Erreur lors de la tentative de réparation: {repair_error}")

            # Si toutes les tentatives échouent, logger l'erreur et le texte
            logger.error(f"Impossible de parser ou réparer le JSON")
            logger.error(f"Erreur JSON: {e}")
            logger.error(
                f"Position de l'erreur: ligne {e.lineno}, colonne {e.colno}")
            logger.error(
                f"Texte reçu (premiers 1000 caractères): {response_text[:1000]}")
            if len(response_text) > 1000:
                logger.error(
                    f"Texte reçu (derniers 500 caractères): {response_text[-500:]}")
            raise ValueError(
                f"Impossible de parser la réponse du modèle en JSON: {str(e)}. "
                f"Le JSON semble incomplet ou mal formé (erreur à la ligne {e.lineno}, colonne {e.colno}). "
                f"Essayez de réduire le nombre de questions ou d'augmenter max_tokens.")

    def _validate_questions(self, questions_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Valide et normalise les questions générées

        Args:
            questions_data: Données JSON parsées

        Returns:
            Liste de questions validées
        """
        if 'questions' not in questions_data:
            raise ValueError(
                "Le JSON généré ne contient pas de clé 'questions'")

        questions = questions_data['questions']
        if not isinstance(questions, list):
            raise ValueError("'questions' doit être une liste")

        validated_questions = []

        for idx, q in enumerate(questions):
            # Vérifier les champs requis
            if 'enonce' not in q or not q['enonce']:
                logger.warning(f"Question {idx} ignorée: pas d'énoncé")
                continue

            if 'options' not in q or not isinstance(q['options'], list):
                logger.warning(
                    f"Question {idx} ignorée: pas d'options valides")
                continue

            # Vérifier qu'il y a au moins 2 options
            if len(q['options']) < 2:
                logger.warning(f"Question {idx} ignorée: moins de 2 options")
                continue

            # Vérifier qu'il y a exactement une réponse correcte
            correct_count = sum(
                1 for opt in q['options'] if opt.get('estCorrecte', False))
            if correct_count != 1:
                # Essayer de corriger: marquer la première option comme correcte si aucune n'est marquée
                if correct_count == 0:
                    q['options'][0]['estCorrecte'] = True
                elif correct_count > 1:
                    # Garder seulement la première option correcte
                    first_correct_found = False
                    for opt in q['options']:
                        if opt.get('estCorrecte', False):
                            if first_correct_found:
                                opt['estCorrecte'] = False
                            else:
                                first_correct_found = True

            # Normaliser la question
            validated_q = {
                'enonce': q['enonce'].strip(),
                'type_question': q.get('type', 'qcm'),
                'options': q['options'],
                'explication': q.get('explication', '').strip(),
                'points': int(q.get('points', 1))
            }

            validated_questions.append(validated_q)

        if not validated_questions:
            raise ValueError("Aucune question valide n'a pu être générée")

        logger.info(
            f"{len(validated_questions)} questions validées sur {len(questions)} générées")
        return validated_questions

    def generate_questions(self, text: str, num_questions: int = 10,
                           matiere: Optional[str] = None,
                           niveau: Optional[str] = None,
                           mention: Optional[str] = None,
                           parcours: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Génère des questions de QCM à partir d'un texte

        Args:
            text: Texte source
            num_questions: Nombre de questions à générer
            matiere: Matière (optionnel)
            niveau: Niveau académique (optionnel)
            mention: Mention académique (optionnel)
            parcours: Parcours académique (optionnel)

        Returns:
            Liste de questions générées et validées
        """
        if not self.api_token:
            raise ValueError(
                "HF_API_TOKEN n'est pas configuré. "
                "Définissez la variable d'environnement HF_API_TOKEN avec votre token Hugging Face."
            )

        # Appeler l'API selon le type utilisé
        if self.use_chat_api:
            # Construire les messages pour l'API chat
            messages = self._build_chat_messages(
                text, num_questions, matiere, niveau, mention, parcours)
            # Appeler l'API Chat Completions
            response_text = self._call_huggingface_api_with_messages(
                messages, num_questions=num_questions)
        else:
            # Ancienne méthode avec prompt texte
            prompt = self._build_prompt(text, num_questions, matiere, niveau, mention, parcours)
            response_text = self._call_huggingface_api(prompt)

        # Extraire et parser le JSON
        questions_data = self._extract_json_from_response(response_text)

        # Valider les questions
        validated_questions = self._validate_questions(questions_data)

        return validated_questions

    def generate_commentaire_resultat(self, note_sur_20: float, pourcentage: float, 
                                     questions_correctes: int, questions_total: int,
                                     est_reussi: bool) -> str:
        """
        Génère un commentaire automatique pour un résultat d'examen
        
        Args:
            note_sur_20: Note sur 20
            pourcentage: Pourcentage de réussite
            questions_correctes: Nombre de questions correctes
            questions_total: Nombre total de questions
            est_reussi: Si l'examen est réussi
            
        Returns:
            Commentaire généré (max 200 caractères, idéal 100)
        """
        if not self.api_token:
            # Fallback si pas de token IA
            if est_reussi:
                return "Excellent travail ! Continuez ainsi."
            elif pourcentage >= 50:
                return "Bon travail. Quelques révisions nécessaires."
            else:
                return "À améliorer. Revoyez les concepts de base."
        
        # Déterminer le ton selon le nombre de réponses correctes
        est_strict = questions_correctes < 10
        
        if est_strict:
            system_message = """Tu es un enseignant strict mais bienveillant qui rédige des commentaires constructifs et fermes sur les résultats d'examen.
Génère UNIQUEMENT le commentaire, sans texte avant ou après. Le commentaire doit être en français, critique mais constructive, direct et inciter à plus d'efforts. Objectif: 100 caractères, maximum strict de 200 caractères. N'utilise JAMAIS de mentions de matières spécifiques."""
        else:
            system_message = """Tu es un enseignant bienveillant qui rédige des commentaires constructifs et fermes sur les résultats d'examen.
Génère UNIQUEMENT le commentaire, sans texte avant ou après. Le commentaire doit être en français, critique mais constructive. Objectif: 100 caractères, maximum strict de 200 caractères. N'utilise JAMAIS de mentions de matières spécifiques."""

        # Construire le prompt selon le niveau de performance
        if est_strict:
            ton_instruction = """Le commentaire doit :
- Être critique mais constructive et ferme
- Se concentrer uniquement sur la note et la performance
- Encourager à plus d'efforts et de révisions
- Être direct et motivant malgré les difficultés
- NE PAS mentionner de matières spécifiques
- Objectif: 100 caractères, maximum strict de 200 caractères
- Être en français"""
        else:
            ton_instruction = """Le commentaire doit :
- Être critique mais constructive et ferme
- Se concentrer uniquement sur la note et la performance
- Mentionner les points à améliorer de manière constructive
- NE PAS mentionner de matières spécifiques
- Objectif: 100 caractères, maximum strict de 200 caractères
- Être en français"""

        user_prompt = f"""Génère un commentaire critique mais constructif pour un résultat d'examen.

Note: {note_sur_20:.1f}/20
Pourcentage: {pourcentage:.1f}%
Questions correctes: {questions_correctes}/{questions_total}
Statut: {'Réussi' if est_reussi else 'Non réussi'}

{ton_instruction}

IMPORTANT: Critique la note de manière constructive mais ferme. N'utilise JAMAIS de mentions de matières spécifiques. Concentre-toi uniquement sur la performance et la note.

Génère uniquement le commentaire, sans guillemets ni texte supplémentaire:"""

        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_prompt}
        ]

        try:
            response_text = self._call_huggingface_api_with_messages(
                messages, num_questions=1
            )
            
            # Nettoyer la réponse (enlever guillemets, espaces, etc.)
            commentaire = response_text.strip()
            # Enlever les guillemets s'ils sont présents
            if commentaire.startswith('"') and commentaire.endswith('"'):
                commentaire = commentaire[1:-1]
            if commentaire.startswith("'") and commentaire.endswith("'"):
                commentaire = commentaire[1:-1]
            
            # Limiter strictement à 200 caractères (pas de "...")
            if len(commentaire) > 200:
                commentaire = commentaire[:200]
            
            return commentaire.strip()
            
        except Exception as e:
            logger.warning(f"Erreur génération commentaire IA: {e}, utilisation du fallback")
            # Fallback si l'IA échoue
            if est_reussi:
                return "Excellent travail ! Continuez ainsi."
            elif pourcentage >= 50:
                return "Bon travail. Quelques révisions nécessaires."
            else:
                return "À améliorer. Revoyez les concepts de base."


# Instance singleton
ai_service = AIService()
