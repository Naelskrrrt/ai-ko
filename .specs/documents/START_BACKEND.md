# Guide de Démarrage du Backend

## 🚀 Démarrage Rapide

### Dans WSL (Linux)

```bash
cd backend
./start_backend.sh
```

### Dans PowerShell (Windows)

```powershell
cd backend
.\start-backend.ps1
```

### Manuellement

```bash
cd backend

# Activer le venv
source venv/bin/activate  # Linux/WSL
# ou
.\venv\Scripts\activate  # Windows PowerShell

# Installer les dépendances (si nécessaire)
pip install -r requirements.txt

# Démarrer le serveur
python run.py
```

## 🔍 Vérification

Une fois le serveur démarré, vous pouvez vérifier qu'il fonctionne :

```bash
# Health check simple
curl http://localhost:5000/health

# Health check détaillé
curl http://localhost:5000/health/detailed

# Documentation Swagger
# Ouvrir dans le navigateur: http://localhost:5000/api/docs/swagger/
```

## ⚠️ Problèmes Courants

### Le venv n'existe pas

```bash
# Créer le venv
python3 -m venv venv

# Ou utiliser le script
./install_and_create_venv.sh
```

### Le fichier activate n'existe pas

Le venv est incomplet. Recréez-le :

```bash
rm -rf venv
./install_and_create_venv.sh
```

### Erreur de connexion à la base de données

Vérifiez votre configuration dans `.env` ou utilisez SQLite par défaut.

### Port 5000 déjà utilisé

```bash
# Changer le port dans run.py ou utiliser une variable d'environnement
export PORT=5001
python run.py
```

## 📝 Notes

- Le serveur démarre en mode développement par défaut (reload automatique)
- Les logs s'affichent dans le terminal
- Pour arrêter le serveur, appuyez sur `Ctrl+C`





