# Overlay Engine

Système d'incrustation dynamique et administrable pour stream live

## Description

- Un serveur : server.js
  Application node.js / socket.io. Réceptif à divers messages envoyé par websocket

- Une webapp "habillage" : /habillage
  Simple page web en full HD (1920x1080 non responsive) affichée dans un navigateur plein écran dont la sortie vidéo
  doit être envoyée au mélangeur vidéo.
  la couleur de chromakey est #00ff01 (vert), elle est appliquée à la balise <body>
  OBS peut bypasser cette valeur pour la rendre transparente

- Une passerelle HTTP REST : GET /push?e=xxx
  Pour les clients sources qui ne communiquent pas en websocket
  ex: /push?e=AOF

- Une webapp "console d'administration" : /admin
  Visualisation de l'habillage + commandes d'envoi des messages + dump des variables système en temps réel

- Une webapp "social wall" : /social-wall
  avec les derniers tweets des critères sélectionnés

## Installation de dev

```
git clone https://github.com/aerogus/overlay-engine.git
cd overlay-engine
cp settings.json.dist settings.json
adapter settings.json
npm install
npm run build
npm start
```

aller sur http://localhost

## Installation de prod sous Debian

- raspberry pi avec sortie HDMI vers mélangeur vidéo
- à l'allumage, doit lancer direct l'app d'habillage (Firefox plein écran, ou app electron)
- cable ethernet direct vers PC d'admin

```
(en root)
cd /var/www
git clone https://github.com/aerogus/overlay-engine.git .
cd overlay-engine
npm install
npm run build
cp *.service /etc/systemd/system
systemctl daemon-reload
systemctl enable overlay-engine-server overlay-engine-update-title overlay-engine-update-social
systemctl start overlay-engine-server overlay-engine-update-title overlay-engine-update-social
crontab crontab
```

## Architecture

Serveur web node/express

approche modulaire ?
- module clock
- module logo

## Type de messages

Ces messages sont envoyables par la console d'admin

- Horloge ON
- Horloge OFF
- Logo ON
- Logo OFF
- Bandeau News ON
- Bandeau News OFF
- ON AIR
- OFF AIR
