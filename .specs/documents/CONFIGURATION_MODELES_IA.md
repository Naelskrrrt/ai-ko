# Configuration des Modèles IA pour la Génération de QCM

## Problème résolu : Erreur 410 (Gone)

Si vous rencontrez l'erreur `410 Client Error: Gone`, cela signifie que le modèle configuré n'est plus disponible sur l'API Hugging Face Inference.

## Solution : Configuration via Variable d'Environnement

Le système supporte maintenant :
1. **Configuration du modèle via variable d'environnement**
2. **Fallback automatique** vers d'autres modèles si le modèle principal échoue
3. **Messages d'erreur améliorés** avec suggestions

## Configuration

### Option 1 : Modèle par défaut (Recommandé)

Le système utilise maintenant **Mistral-7B-Instruct** par défaut, qui est plus stable :

```bash
# Pas besoin de configurer, le modèle par défaut est utilisé
# Modèle: mistralai/Mistral-7B-Instruct-v0.2
```

### Option 2 : Choisir un modèle spécifique

Ajoutez dans votre fichier `.env` :

```bash
# Modèle Hugging Face à utiliser
HF_MODEL=mistralai/Mistral-7B-Instruct-v0.2
```

## Modèles Disponibles

### Modèles Recommandés

| Modèle | Taille | Avantages | Inconvénients |
|--------|--------|-----------|---------------|
| `mistralai/Mistral-7B-Instruct-v0.2` | 7B | ✅ Excellent français<br>✅ Très stable<br>✅ Bonne génération structurée | Légèrement plus lent |
| `meta-llama/Llama-3.2-3B-Instruct` | 3B | ✅ Rapide<br>✅ Léger | Moins performant pour le français |
| `microsoft/Phi-3-mini-4k-instruct` | 3.8B | ✅ Très rapide<br>✅ Bonne qualité | Limite de contexte plus petite |
| `Qwen/Qwen2.5-1.5B-Instruct` | 1.5B | ✅ Très rapide<br>✅ Léger | Qualité moindre pour les QCM complexes |

### Modèle par défaut

Le système utilise maintenant **Mistral-7B-Instruct** comme modèle par défaut car :
- ✅ Plus stable et disponible
- ✅ Excellente compréhension du français
- ✅ Bonne génération de JSON structuré
- ✅ Performances constantes

## Fallback Automatique

Le système essaie automatiquement les modèles suivants si le modèle principal échoue :

1. Modèle configuré (via `HF_MODEL` ou défaut)
2. `mistralai/Mistral-7B-Instruct-v0.2`
3. `meta-llama/Llama-3.2-3B-Instruct`
4. `microsoft/Phi-3-mini-4k-instruct`
5. `Qwen/Qwen2.5-1.5B-Instruct`

Si tous les modèles échouent, une erreur claire est retournée avec des suggestions.

## Exemples de Configuration

### Développement (rapide)

```bash
# .env
HF_API_TOKEN=votre_token
HF_MODEL=microsoft/Phi-3-mini-4k-instruct  # Plus rapide pour les tests
```

### Production (qualité)

```bash
# .env
HF_API_TOKEN=votre_token
HF_MODEL=mistralai/Mistral-7B-Instruct-v0.2  # Meilleure qualité
```

### Sans configuration (défaut)

```bash
# .env
HF_API_TOKEN=votre_token
# HF_MODEL non défini = utilise Mistral-7B-Instruct par défaut
```

## Dépannage

### Erreur : "410 Client Error: Gone"

**Cause :** Le modèle spécifié n'est plus disponible.

**Solution :** 
1. Vérifiez que `HF_MODEL` pointe vers un modèle valide
2. Le système essaiera automatiquement les modèles de fallback
3. Si tous échouent, configurez manuellement un modèle valide

### Erreur : "Tous les modèles ont échoué"

**Causes possibles :**
- Token Hugging Face invalide ou expiré
- Problème de connexion internet
- Tous les modèles sont temporairement indisponibles

**Solutions :**
1. Vérifiez votre `HF_API_TOKEN` dans `.env`
2. Testez votre connexion internet
3. Attendez quelques minutes et réessayez
4. Vérifiez le statut de l'API Hugging Face

### Erreur : "Timeout lors de la génération"

**Cause :** Le modèle est surchargé ou prend trop de temps.

**Solutions :**
1. Réessayez dans quelques minutes
2. Utilisez un modèle plus léger (Phi-3-mini ou Qwen-1.5B)
3. Réduisez le nombre de questions à générer

## Vérification de la Configuration

### Tester le modèle configuré

Le système log automatiquement le modèle utilisé. Vérifiez les logs au démarrage :

```
INFO: Configuration AI Service - Modèle: mistralai/Mistral-7B-Instruct-v0.2
```

### Tester avec un modèle spécifique

```bash
# Dans .env
HF_MODEL=mistralai/Mistral-7B-Instruct-v0.2
```

Redémarrez le serveur et testez la génération.

## Notes Importantes

1. **Token Hugging Face :** Nécessaire pour tous les modèles. Obtenez-le sur [Hugging Face Settings](https://huggingface.co/settings/tokens)

2. **Performance :** Les modèles plus grands (7B) sont plus lents mais génèrent de meilleures questions

3. **Coûts :** L'API Hugging Face Inference est gratuite pour les modèles publics, mais peut avoir des limites de rate

4. **Disponibilité :** Les modèles peuvent être temporairement indisponibles. Le système de fallback gère cela automatiquement

## Migration depuis Qwen2.5-7B-Instruct

Si vous utilisiez `Qwen/Qwen2.5-7B-Instruct` et rencontrez l'erreur 410 :

1. **Option automatique :** Le système basculera automatiquement vers Mistral-7B-Instruct
2. **Option manuelle :** Configurez explicitement dans `.env` :
   ```bash
   HF_MODEL=mistralai/Mistral-7B-Instruct-v0.2
   ```

Les deux modèles ont des performances similaires pour la génération de QCM.




