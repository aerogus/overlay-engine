# Overlay Engine

Système d'incrustation dynamique et administrable pour stream live

## Description

- Un serveur : server.js
  Application node.js / socket.io. Réceptif à divers messages envoyé par websocket

- Une webapp "habillage" : /habillage
  Simple page web 1920x1080 affichée dans un navigateur plein écran dont la sortie vidéo
  doit être envoyée au mélangeur vidéo.

- Une passerelle HTTP REST : /push
  Pour les clients sources qui ne communiquent pas en websocket

- Une webapp "console d'administration" : /admin
  Visualisation de l'habillage + commandes d'envoi des messages + dump des variables système en temps réel

- Une webapp "tweet wall" : /tweet-wall

## Installation de dev

git clone git@github.com:aerogus/overlay-engine.git .
cd overlay-engine
éditer conf/overlay-engine.yaml
npm install
npm run build
npm start

aller sur http://localhost

## Installation de prod sous Debian

- raspberry pi avec sortie HDMI vers mélangeur vidéo
- à l'allumage, doit lancer direct l'app d'habillage (Firefox plein écran, ou app electron)
- cable ethernet direct vers PC d'admin

(en root)
mkdir /var/www/overlay-engine
cd /var/www/overlay-engine
git clone https://github.com/aerogus/overlay-engine.git .
npm install
npm run build
cp overlay-service /etc/systemd/system/overlay-engine.service
systemctl daemon-reload
systemctl enable overlay-engine
systemctl start overlay-engine

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


Title (todo à parser):
http://www.blpradio.fr/sam/livetitle.php

