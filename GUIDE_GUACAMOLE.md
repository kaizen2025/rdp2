# Guide de Configuration Guacamole

## Démarrage Rapide avec Docker

### 1. Démarrer Guacamole avec Docker

```bash
# Créer le réseau
docker network create guacamole-net

# Démarrer guacd (le daemon Guacamole)
docker run -d \
  --name guacd \
  --network guacamole-net \
  guacamole/guacd

# Démarrer Guacamole avec l'extension JSON
docker run -d \
  --name guacamole \
  --network guacamole-net \
  -e GUACD_HOSTNAME=guacd \
  -e JSON_ENABLED=true \
  -e JSON_SECRET_KEY=PBWmJHC2mKfvSUtc7eG7/d/QpPmeBrTAq9L6EgQHy+w= \
  -p 8080:8080 \
  guacamole/guacamole
```

### 2. Vérifier que Guacamole fonctionne

```bash
# Tester l'accès
curl http://localhost:8080/guacamole/

# Devrait retourner du HTML avec "Guacamole"
```

### 3. ⚠️ IMPORTANT - Clé Secrète

La clé `JSON_SECRET_KEY` **DOIT** être identique dans:
- Docker (variable d'environnement ci-dessus)
- Fichier `config/config.json` → `guacamole.secretKey`

**Valeur actuelle:** `PBWmJHC2mKfvSUtc7eG7/d/QpPmeBrTAq9L6EgQHy+w=`

---

## Configuration Manuelle (Sans Docker)

Si vous préférez installer Guacamole manuellement:

### 1. Installer Guacamole

Suivre: https://guacamole.apache.org/doc/gug/installing-guacamole.html

### 2. Télécharger l'extension JSON

```bash
# Télécharger depuis:
# https://guacamole.apache.org/releases/

# Example pour la version 1.5.0:
cd /var/lib/guacamole/extensions
wget https://downloads.apache.org/guacamole/1.5.0/binary/guacamole-auth-json-1.5.0.jar
```

### 3. Configurer guacamole.properties

Fichier: `/etc/guacamole/guacamole.properties`

```properties
# Extension d'authentification JSON
auth-provider: net.sourceforge.guacamole.net.auth.json.JSONAuthenticationProvider

# Clé secrète (DOIT correspondre à config.json)
json-secret-key: PBWmJHC2mKfvSUtc7eG7/d/QpPmeBrTAq9L6EgQHy+w=

# Serveur Guacd
guacd-hostname: localhost
guacd-port: 4822
```

### 4. Redémarrer Guacamole

```bash
# Tomcat
sudo systemctl restart tomcat9

# Ou selon votre installation
sudo systemctl restart guacamole
```

---

## Vérification de la Configuration

### Test 1: Guacamole répond

```bash
curl http://localhost:8080/guacamole/
```
✅ Attendu: HTML contenant "Guacamole"

### Test 2: Extension JSON installée

Vérifier les logs de Guacamole:

```bash
# Docker
docker logs guacamole | grep -i json

# Manuel
tail -f /var/log/tomcat9/catalina.out | grep -i json
```

✅ Attendu: Ligne indiquant que l'extension JSON est chargée

### Test 3: Connexion depuis l'application

1. Ouvrir l'application RDS Viewer
2. Aller sur "Sessions RDS"
3. Cliquer sur "Connexion Shadow" ou "Connexion Directe"
4. Vérifier dans la console:

✅ Bon signe:
```
🔌 Initialisation Guacamole Viewer...
✅ Taille du display envoyée au serveur Guacamole
```

❌ Problème si vous voyez:
```
WebSocket connection to 'ws://localhost:8080/guacamole/websocket-tunnel' failed
```

---

## Débogage des Problèmes Courants

### Problème 1: "WebSocket connection failed"

**Causes possibles:**
1. Guacamole n'est pas démarré
2. Port 8080 bloqué par un firewall
3. Extension JSON pas installée

**Solutions:**
```bash
# Vérifier que Guacamole tourne
docker ps | grep guacamole
# Ou
netstat -tuln | grep 8080

# Vérifier les logs Docker
docker logs guacamole

# Redémarrer Guacamole
docker restart guacamole guacd
```

### Problème 2: "Invalid signature" ou "Authentication failed"

**Cause:** Les clés secrètes ne correspondent pas

**Solution:**
1. Vérifier `config/config.json`:
   ```json
   "guacamole": {
     "secretKey": "PBWmJHC2mKfvSUtc7eG7/d/QpPmeBrTAq9L6EgQHy+w="
   }
   ```

2. Vérifier Docker:
   ```bash
   docker inspect guacamole | grep JSON_SECRET_KEY
   ```

3. Les deux doivent être **identiques**

### Problème 3: Erreur 768 Guacamole

**Erreur:** `Guacamole.Status code: 768`

**Cause:** Le serveur RDS cible n'est pas accessible

**Vérifications:**
1. Le serveur RDS est-il allumé ?
2. Le port 3389 est-il accessible ?
3. Les credentials sont-ils corrects ?

```bash
# Tester la connexion RDP depuis le serveur Guacamole
telnet SRV-RDS-3 3389
```

### Problème 4: Connexion établie mais écran noir

**Causes possibles:**
1. Résolution d'écran incorrecte
2. Droits insuffisants pour le shadow
3. Session déjà en cours

**Solution:**
Vérifier dans les logs backend que le token JWT est bien généré avec les bons paramètres.

---

## Configuration Avancée

### Augmenter le timeout WebSocket

Dans `guacamole.properties`:
```properties
# Timeout en millisecondes (5 minutes)
guacamole-http-timeout: 300000
```

### Activer les logs de debug

Dans `guacamole.properties`:
```properties
# Niveau de log
log-level: debug
```

Dans le backend Node.js (`server/server.js`):
```javascript
// Décommenter pour voir les tokens générés
console.log('Token Guacamole:', token);
```

### Configurer l'enregistrement des sessions

```properties
# Enregistrer les sessions
recording-path: /var/recordings
create-recording-path: true
```

---

## Commandes Utiles

### Docker

```bash
# Voir les logs en temps réel
docker logs -f guacamole

# Redémarrer
docker restart guacamole guacd

# Arrêter
docker stop guacamole guacd

# Nettoyer et recommencer
docker rm -f guacamole guacd
docker network rm guacamole-net
```

### Debugging

```bash
# Vérifier que le port est ouvert
nc -zv localhost 8080

# Tester la connexion WebSocket
wscat -c ws://localhost:8080/guacamole/websocket-tunnel

# Voir les processus qui utilisent le port 8080
lsof -i :8080
```

---

## Checklist de Validation

- [ ] Guacamole démarre sans erreur
- [ ] Extension JSON chargée (voir logs)
- [ ] Clé secrète identique dans Docker et config.json
- [ ] `curl http://localhost:8080/guacamole/` retourne du HTML
- [ ] Pas d'erreur de firewall sur le port 8080
- [ ] Le backend Node.js génère des tokens (voir logs)
- [ ] La connexion depuis l'application fonctionne

---

## Support et Documentation

- Documentation officielle: https://guacamole.apache.org/doc/gug/
- Extension JSON: https://guacamole.apache.org/doc/gug/json-auth.html
- GitHub: https://github.com/apache/guacamole-server

---

**Dernière mise à jour:** 2025-10-23
