# Mise à jour des variables d'environnement pour ngrok

## ✅ Variables mises à jour

Les variables d'environnement suivantes ont été mises à jour dans `.env` pour utiliser l'URL ngrok :

```env
NEXTAUTH_URL=https://mousey-vowelly-cleopatra.ngrok-free.dev
BETTER_AUTH_URL=https://mousey-vowelly-cleopatra.ngrok-free.dev
GOOGLE_REDIRECT_URI=https://mousey-vowelly-cleopatra.ngrok-free.dev/api/auth/callback/google
```

## 🔄 Redémarrage requis

**Important** : Vous devez redémarrer le backend pour que les changements prennent effet :

```bash
cd backend
# Arrêtez le serveur (Ctrl+C) et relancez
python run.py
```

## ⚙️ Configuration Google OAuth

Assurez-vous que votre application Google OAuth est configurée avec la bonne URL de redirection :

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet
3. Allez dans "APIs & Services" > "Credentials"
4. Modifiez votre OAuth 2.0 Client ID
5. Ajoutez l'URL de redirection autorisée :
   ```
   https://mousey-vowelly-cleopatra.ngrok-free.dev/api/auth/callback/google
   ```

## 📝 Note importante

Si votre URL ngrok change (ce qui arrive à chaque redémarrage de ngrok avec le plan gratuit), vous devrez :

1. Mettre à jour les variables dans `.env`
2. Mettre à jour l'URL de redirection dans Google Cloud Console
3. Redémarrer le backend

Pour éviter cela, vous pouvez utiliser un compte ngrok payant qui permet d'avoir des URLs fixes.

