# Guide de Configuration pour Git Bash

## 🚀 Démarrage Rapide

### 1. Créer l'environnement virtuel

```bash
cd backend
./create_venv_gitbash.sh
```

Ou manuellement :

```bash
cd backend
python -m venv venv
```

### 2. Activer le venv

```bash
# Dans Git Bash
source venv/Scripts/activate
```

### 3. Installer les dépendances

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Démarrer le backend

```bash
# Option 1 : Script automatique
./start_backend_gitbash.sh

# Option 2 : Manuellement
source venv/Scripts/activate
python run.py
```

## 📝 Commandes Utiles

### Activer/Désactiver le venv

```bash
# Activer
source venv/Scripts/activate

# Désactiver
deactivate
```

### Vérifier l'installation

```bash
# Vérifier Python
python --version

# Vérifier pip
pip --version

# Lister les packages installés
pip list

# Vérifier Flask
python -c "import flask; print('Flask OK')"
```

### Migrations de base de données

```bash
source venv/Scripts/activate

# Appliquer les migrations
flask db upgrade

# Créer une nouvelle migration
flask db migrate -m "Description de la migration"
```

## 🔧 Problèmes Courants

### Le venv n'existe pas

```bash
./create_venv_gitbash.sh
```

### Erreur "activate: no such file or directory"

Le venv est incomplet. Recréez-le :

```bash
rm -rf venv
./create_venv_gitbash.sh
```

### Python n'est pas trouvé

1. Vérifiez que Python est installé : `python --version`
2. Ajoutez Python au PATH si nécessaire
3. Redémarrez Git Bash

### Erreur de permissions

Si vous avez des problèmes de permissions, exécutez Git Bash en tant qu'administrateur.

### Le serveur ne démarre pas

Vérifiez que le port 5000 n'est pas déjà utilisé :

```bash
# Windows PowerShell
netstat -ano | findstr :5000

# Ou changez le port dans run.py
```

## 🎯 Scripts Disponibles

- `create_venv_gitbash.sh` - Crée l'environnement virtuel
- `start_backend_gitbash.sh` - Démarre le serveur backend
- `fix_api_issues.py` - Corrige les problèmes API (nécessite le serveur en cours d'exécution)
- `test_all_api.py` - Teste toutes les API (nécessite le serveur en cours d'exécution)

## 📚 Documentation Complémentaire

- [Guide de démarrage backend](START_BACKEND.md)
- [Configuration backend](../BACKEND_SETUP.md)
- [Tests API](TEST_API_README.md)





