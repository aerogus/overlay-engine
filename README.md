# Overlay Engine

Système d‘incrustation dynamique et administrable pour stream live.

* Gestion d'une **grille des programme** pour affichage auto du nom de l‘**émission courante** + **curseur de progression**
* Suivi, modération et sélection des **tweets** à afficher
* **Bandeau de news** *telex* administrable
* Affichage auto du **titre/artiste** à chaque début de chanson (+ mode manuel)

## Histoire

Ce projet a été utilisé pour la diffusion vidéo live de l'émission couvrant la cérémonie des Oscars 2020 le 9 février 2020
sur [BLP Radio](http://www.blpradio.fr) à la [MJC Boby Lapointe](http://www.mjcvillebon.org) de Villebon-sur-Yvette.

![Incrustation de l'habillage dans le mélange vidéo](/doc/live.jpg)

## Description

* Un serveur : `/app/server.js`
  * Application node.js / socket.io. Réceptif à divers messages envoyé par websocket

* Une webapp "habillage" : `/`
  * Simple page web en full HD (1920x1080 non responsive) affichée dans un navigateur plein écran dont la sortie vidéo
  doit être envoyée au mélangeur vidéo.
  la couleur de chromakey est #00ff00 (vert), elle est appliquée à la balise <body>
  note: OBS peut bypasser cette valeur pour la rendre transparente.

![Habillage](/doc/habillage.jpg)

* Une webapp "console d‘administration" : `/admin`
  * Prévisualisation live de l'habillage
  * Gestion (ajout/suppression) de messages telex
  * Gestion (ajout) du titre/artiste en mode manuel

![Administration](/doc/admin.jpg)

* Une webapp "social wall" : `/wall`
  * derniers tweets des critères (track+lang) sélectionnés 
  * bouton ON AIR pour affichage sur l‘habillage

![Social Wall](/doc/wall.jpg)

## Installation

### dev

```
git clone https://github.com/aerogus/overlay-engine.git
cd overlay-engine
cp settings.json.dist settings.json
//adapter settings.json
npm install
npm run build
npm start
```

Pour les messages sociaux twitter, vous devez avoir un compte sur cette plateforme, avoir créé une "app"
et récupéré vos identifiants `CONSUMER_KEY`, `CONSUMER_SECRET`, `TOKEN_KEY` et `ACCESS_TOKEN_SECRET` et les saisir dans `settings.json`.

Les webapps sont sur http://localhost, http://localhost/admin et http://localhost/wall

### prod (sous Linux avec systemd, ex Debian)

- ex raspberry pi avec sortie HDMI vers mélangeur vidéo
- à l'allumage, doit lancer direct l'app d'habillage (Firefox plein écran, ou app electron)
- cable ethernet direct vers PC d'admin

```
# cd /var/www
# git clone https://github.com/aerogus/overlay-engine.git .
# cd overlay-engine
# cp settings.json.dist settings.json
# //adapter settings.json
# npm install
# npm run build
# cp *.service /etc/systemd/system
# systemctl daemon-reload
# systemctl enable overlay-engine-*
# systemctl start overlay-engine-*
# crontab crontab
```

## Type de messages websocket

* Tous les messages clients sont techniquem,t émis vers le serveur, le tableau ci-dessous est une vue simplifiée
des échanges principaux
* Les clients n'écoutent que les messages qui les intéressent
* @TODO un schéma + visuel :)

Nom     | Expéditeur    | Destinataire | Description
------- | ------------- | ------------ | -----------
TWI     | push-twitter  | server       | Message issu de la stream API twitter
FBL     | push-facebook | server       | Message issu d'un Facebook Live
SOC     | server        | wall         | Message social, format commun multi source
SOC_AIR | wall          | habillage    | Afficher le message social modéré
ZIK     | push-title    | habillage    | Info de début de nouvelle chanson, mode auto
ZIK     | admin         | habillage    | Info de début de nouvelle chanson, mode manuel
EMI     | push-show     | habillage    | Infos sur l'émission courante
TLX     | admin         | habillage    | Tableau des messages du telex
TLX_DEL | admin         | server       | efface un message telex
DMP     | client        | client       | client demandant le dump mémoire du serveur
