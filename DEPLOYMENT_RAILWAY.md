# Commandes de Déploiement Railway

## Préparation du déploiement

Une fois que le build frontend est réussi, vous pouvez redéployer les services sur Railway.

### Backend

```bash
cd backend
railway up
```

Le backend utilise Dockerfile et sera déployé automatiquement avec la nouvelle méthode `generer_pdf_eleves_enseignant()` dans le service PDF.

### Frontend

```bash
cd frontend
railway up
```

Le frontend utilise Nixpacks et sera déployé avec la nouvelle page `/enseignant/eleves`.

## Notes

- Les deux services doivent être redéployés pour que la fonctionnalité complète soit disponible
- Le backend doit être déployé en premier pour que l'API soit disponible
- Le frontend peut être déployé après le backend

## Vérification post-déploiement

1. Vérifier que l'endpoint `/api/enseignants/<id>/etudiants` fonctionne
2. Vérifier que l'endpoint `/api/enseignants/<id>/etudiants/export-pdf` fonctionne
3. Tester la page `/enseignant/eleves` dans l'interface
4. Tester les filtres (niveau, matière, parcours)
5. Tester l'export PDF avec et sans filtres



