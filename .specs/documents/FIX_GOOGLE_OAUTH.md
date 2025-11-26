# Correction de l'erreur redirect_uri_mismatch

## Problème
L'erreur `redirect_uri_mismatch` signifie que l'URI de redirection configurée dans Google Cloud Console ne correspond pas exactement à celle utilisée dans votre application.

## Solution

### 1. Vérifier l'URI utilisée dans votre application

L'URI de redirection utilisée est : **`http://localhost:3000/api/auth/callback/google`**

Vérifiez dans votre fichier `.env` :
```env
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
```

### 2. Configurer Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet
3. Allez dans **APIs & Services** > **Credentials**
4. Cliquez sur votre **OAuth 2.0 Client ID**
5. Dans la section **Authorized redirect URIs**, ajoutez exactement :
   ```
   http://localhost:3000/api/auth/callback/google
   ```

**IMPORTANT** :
- L'URI doit correspondre **exactement** (même casse, même protocole)
- Pas d'espace avant ou après
- Pas de slash final
- Utilisez `http://` (pas `https://`) pour localhost

### 3. Vérifier les autres configurations

Dans **Authorized JavaScript origins**, ajoutez :
```
http://localhost:3000
```

### 4. Sauvegarder et tester

1. Cliquez sur **Save** dans Google Cloud Console
2. Attendez quelques secondes pour que les changements soient propagés
3. Redémarrez votre backend si nécessaire
4. Testez à nouveau la connexion Google

## Vérification rapide

Pour vérifier l'URI exacte utilisée par votre application, regardez les logs du backend lors du clic sur "Continuer avec Google". L'URL générée devrait contenir :
```
redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback%2Fgoogle
```

Qui correspond à : `http://localhost:3000/api/auth/callback/google` (encodé)

## Pour la production

Quand vous déployez en production, ajoutez également l'URI de production dans Google Cloud Console :
```
https://votre-domaine.com/api/auth/callback/google
```

Et mettez à jour votre `.env` :
```env
GOOGLE_REDIRECT_URI=https://votre-domaine.com/api/auth/callback/google
```

## Dépannage supplémentaire

Si le problème persiste :

1. **Vérifiez qu'il n'y a pas d'espaces** dans votre `.env` :
   ```env
   # ❌ Incorrect
   GOOGLE_REDIRECT_URI= http://localhost:3000/api/auth/callback/google
   
   # ✅ Correct
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
   ```

2. **Vérifiez le port** : Assurez-vous que votre frontend tourne bien sur le port 3000

3. **Vérifiez le protocole** : Pour localhost, utilisez `http://` (pas `https://`)

4. **Attendez la propagation** : Les changements dans Google Cloud Console peuvent prendre quelques minutes



