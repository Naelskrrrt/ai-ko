# Solution pour ngrok sur Windows

## Problème

Si vous obtenez l'erreur :
```
cannot execute binary file: Exec format error
```

Cela signifie qu'un binaire Linux a été installé au lieu d'un binaire Windows.

## Solution

### 1. Désinstaller ngrok de pnpm (si installé)

```bash
pnpm remove -g ngrok
```

### 2. Installer ngrok via npm

```bash
npm install -g ngrok
```

**Pourquoi npm et pas pnpm ?**
- npm installe correctement les binaires Windows
- pnpm peut installer des binaires Linux même sur Windows

### 3. Vérifier l'installation

```bash
ngrok version
# Devrait afficher: ngrok version X.X.X
```

### 4. Configurer le token

```bash
ngrok config add-authtoken VOTRE_TOKEN_ICI
```

### 5. Vérifier la configuration

```bash
ngrok config check
# Devrait afficher: Valid configuration file at ...
```

## Utilisation

Une fois installé correctement, vous pouvez utiliser :

```bash
# Exposer le frontend
ngrok http 3000

# Exposer le backend
ngrok http 5000
```

Ou utiliser les scripts fournis :

```powershell
# PowerShell
.\start-ngrok-frontend.ps1
.\start-ngrok-backend.ps1
```

```bash
# Bash
./start-ngrok-frontend.sh
./start-ngrok-backend.sh
```

## Alternative : Scripts Node.js

Si vous préférez ne pas installer ngrok globalement, utilisez les scripts Node.js :

1. Configurez `NGROK_AUTHTOKEN` dans `.env` ou `frontend/.env.local`
2. Utilisez les scripts npm :

```bash
cd frontend
pnpm run ngrok:frontend
pnpm run ngrok:backend
```

