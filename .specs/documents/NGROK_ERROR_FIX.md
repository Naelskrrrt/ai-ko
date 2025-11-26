# Correction de l'erreur ERR_NGROK_8012 - Port 300 au lieu de 3000

## 🔴 Erreur

```
ERR_NGROK_8012
Traffic successfully made it to the ngrok agent, but the agent failed to establish a connection to the upstream web service at http://localhost:300
```

## 🔍 Cause

Ngrok essaie de se connecter au port **300** au lieu du port **3000**. Cela signifie que vous avez probablement lancé ngrok avec la mauvaise commande.

## ✅ Solution

### 1. Arrêtez ngrok actuel

Appuyez sur `Ctrl+C` dans le terminal où ngrok tourne.

### 2. Vérifiez que le frontend est bien démarré sur le port 3000

```bash
# Vérifiez que le frontend tourne
curl http://localhost:3000
# Ou ouvrez http://localhost:3000 dans votre navigateur
```

### 3. Relancez ngrok avec le bon port

**Option A : Utiliser le script PowerShell (recommandé)**
```powershell
.\start-ngrok-frontend.ps1
```

**Option B : Commande directe**
```bash
ngrok http 3000
```

**⚠️ Important** : Assurez-vous d'utiliser **3000** et non **300** !

### 4. Vérifiez la configuration

Si vous utilisez un fichier de configuration ngrok, vérifiez qu'il utilise le bon port :

```yaml
tunnels:
  frontend:
    addr: 3000  # ✅ Correct
    # addr: 300  # ❌ Incorrect
```

## 🔧 Vérifications

1. **Port du frontend** : Le frontend Next.js doit tourner sur le port 3000
   ```bash
   cd frontend
   pnpm run dev
   # Devrait afficher: ready - started server on 0.0.0.0:3000
   ```

2. **Commande ngrok** : Utilisez toujours `ngrok http 3000` (avec le zéro à la fin)

3. **Test de connexion** : Testez que le frontend répond bien
   ```bash
   curl http://localhost:3000
   # Ou ouvrez http://localhost:3000 dans votre navigateur
   ```

## 📋 Commandes correctes

```bash
# ✅ CORRECT
ngrok http 3000

# ❌ INCORRECT (manque un zéro)
ngrok http 300
```

## 🚀 Workflow complet

1. **Démarrer le frontend** :
   ```bash
   cd frontend
   pnpm run dev
   ```

2. **Vérifier que le frontend répond** :
   ```bash
   curl http://localhost:3000
   # Ou ouvrez http://localhost:3000 dans votre navigateur
   ```

3. **Démarrer ngrok** (dans un nouveau terminal) :
   ```bash
   ngrok http 3000
   # OU
   .\start-ngrok-frontend.ps1
   ```

4. **Vérifier l'URL ngrok** : Vous devriez voir quelque chose comme :
   ```
   Forwarding   https://abc123.ngrok-free.app -> http://localhost:3000
   ```

## 🐛 Si le problème persiste

1. **Vérifiez les processus qui utilisent le port 3000** :
   ```powershell
   # Windows PowerShell
   netstat -ano | findstr :3000
   ```

2. **Vérifiez que le frontend est bien démarré** :
   - Ouvrez http://localhost:3000 dans votre navigateur
   - Vous devriez voir votre application

3. **Redémarrez ngrok** :
   - Arrêtez ngrok (Ctrl+C)
   - Relancez avec `ngrok http 3000`

4. **Vérifiez la configuration ngrok** :
   ```bash
   ngrok config check
   ```

