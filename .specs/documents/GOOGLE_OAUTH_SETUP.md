# Configuration Google OAuth

Ce guide vous explique comment configurer Google OAuth pour l'authentification dans AI-KO.

## Étapes de Configuration

### 1. Créer un Projet dans Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Notez l'ID du projet

### 2. Activer l'API Google+

1. Dans le menu latéral, allez dans **APIs & Services** > **Library**
2. Recherchez "Google+ API" ou "Google Identity"
3. Cliquez sur **Enable** pour activer l'API

### 3. Créer des Credentials OAuth 2.0

1. Allez dans **APIs & Services** > **Credentials**
2. Cliquez sur **Create Credentials** > **OAuth client ID**
3. Si c'est la première fois, configurez l'écran de consentement OAuth :
   - Choisissez **External** (pour le développement)
   - Remplissez les informations requises (nom de l'application, email de support, etc.)
   - Ajoutez votre email dans **Test users** si nécessaire
   - Enregistrez et continuez

4. Créez l'OAuth Client ID :
   - **Application type**: Web application
   - **Name**: AI-KO (ou un nom de votre choix)
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (pour le développement)
     - `https://votre-domaine.com` (pour la production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (pour le développement)
     - `https://votre-domaine.com/api/auth/callback/google` (pour la production)

5. Cliquez sur **Create**
6. **Important**: Copiez le **Client ID** et le **Client Secret**

### 4. Configurer les Variables d'Environnement

Ajoutez les credentials dans votre fichier `.env` :

```env
GOOGLE_CLIENT_ID=votre_client_id_ici
GOOGLE_CLIENT_SECRET=votre_client_secret_ici
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
```

**Pour la production**, remplacez `http://localhost:3000` par votre domaine.

### 5. Vérification

1. Redémarrez vos services Docker :
   ```bash
   docker-compose restart backend frontend
   ```

2. Testez la connexion Google :
   - Allez sur `/login` ou `/register`
   - Cliquez sur "Continuer avec Google"
   - Vous devriez être redirigé vers Google pour l'authentification
   - Après autorisation, vous serez redirigé vers votre application

## Dépannage

### Erreur "redirect_uri_mismatch"

- Vérifiez que l'URI de redirection dans Google Cloud Console correspond exactement à celle dans votre `.env`
- Les URIs sont sensibles à la casse et doivent correspondre exactement (y compris le protocole http/https)

### Erreur "invalid_client"

- Vérifiez que le Client ID et Client Secret sont corrects dans votre `.env`
- Assurez-vous qu'il n'y a pas d'espaces avant/après les valeurs

### L'authentification fonctionne mais l'utilisateur n'est pas créé

- Vérifiez les logs du backend : `docker-compose logs backend`
- Vérifiez que la base de données est accessible
- Vérifiez que les migrations ont été exécutées : `docker-compose exec backend flask db upgrade`

## Sécurité en Production

1. **Ne commitez jamais** votre `.env` avec les credentials
2. Utilisez des variables d'environnement sécurisées (AWS Secrets Manager, Azure Key Vault, etc.)
3. Configurez HTTPS en production
4. Limitez les domaines autorisés dans Google Cloud Console
5. Activez l'écran de consentement OAuth en mode "Production" après vérification

## Ressources

- [Documentation Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)



