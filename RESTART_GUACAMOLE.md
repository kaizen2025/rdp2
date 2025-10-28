# Instructions pour redémarrer Guacamole

L'extension **auth-json** a été installée avec succès. Pour que Guacamole la charge, vous devez redémarrer les conteneurs Docker.

## Étapes à suivre

### 1. Ouvrir un terminal sur votre serveur

### 2. Naviguer vers le dossier du projet
```bash
cd /home/user/rdp
```

### 3. Redémarrer les conteneurs Docker
```bash
docker-compose down
docker-compose up -d
```

### 4. Vérifier que tous les conteneurs sont démarrés
```bash
docker ps
```

Vous devriez voir 3 conteneurs en cours d'exécution :
- `rds-viewer-guacd`
- `rds-viewer-guacamole`
- `rds-viewer-mysql`

### 5. Vérifier les logs du conteneur Guacamole
```bash
docker logs rds-viewer-guacamole
```

Recherchez cette ligne confirmant que l'extension est chargée :
```
Loading extension: /opt/guacamole/extensions/guacamole-auth-json-1.5.3.jar
```

### 6. Tester la connexion

Une fois les conteneurs redémarrés, retournez sur votre application RDS Viewer et essayez à nouveau de vous connecter à une session RDS.

## En cas de problème

Si vous rencontrez des erreurs, vérifiez les logs :
```bash
docker logs rds-viewer-guacamole
docker logs rds-viewer-guacd
docker logs rds-viewer-mysql
```
