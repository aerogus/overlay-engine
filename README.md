# Overlay Engine

Système d‘incrustation dynamique et administrable pour stream live.

* Gestion d'une **grille des programme** pour affichage auto du nom de l‘**émission courante** + **curseur de progression** + **Horloge**
* Affichage d'un **logo** personnalisable
* Sélection des **tweets** à afficher, relatifs à un hashtag ou à un compte
* Sélection des **commentaires** à afficher, relatifs à une vidéo Facebook Live
* Affichage des **réactions** relatives à une vidéo Facebook Live
* **Bandeau de news** *telex* administrable
* Affichage auto du **titre/artiste** à chaque début de chanson (+ mode manuel)

## Historique

Ce projet a été créé à la base pour le compte d'une radio rock parisienne en 2015, qui l'a exploité plusieurs années ([vidéo 1](https://www.youtube.com/watch?v=jHVS-8zpo2s), [video 2](https://www.youtube.com/watch?v=q2kgZQjWs1M), [vidéo 3](https://www.youtube.com/watch?v=kBs-sjqsGXU)). Il a été libéré et utilisé pour la diffusion vidéo live de l'émission couvrant la cérémonie des Oscars 2020 le 9 février 2020 sur [BLP Radio](http://www.blpradio.fr) à la [MJC Boby Lapointe](http://www.mjcvillebon.org) de Villebon-sur-Yvette. Depuis il sert d'habillage pour les streams Live de l'[association AD'HOC](https://www.adhocmusic.com), conjointement avec le projet [dynamic-background](https://github.com/aerogus/dynamic-background) pour générer un fond dynamique.

![Incrustation de l'habillage dans le mélangeur vidéo](/doc/live.jpg)

## Description

* Un serveur : `/app/server.js`
  * Application node.js / socket.io. Réceptif à divers messages envoyé par websocket

* Une webapp "habillage" : `/`
  * Simple page web en full HD (1920x1080 non responsive) affichée dans un navigateur plein écran dont la sortie vidéo
  doit être envoyée au mélangeur vidéo. La couleur de chromakey (le fond vert virtuel) est appliquée à la balise <body>. OBS peut bypasser cette valeur pour la rendre transparente.

![Habillage](/doc/habillage.jpg)

* Une webapp "console d‘administration" : `/admin`
  * Prévisualisation live de l'habillage
  * Gestion (ajout/suppression) de messages telex
  * Gestion (ajout) du titre/artiste en mode manuel
  * réception et modération des flux sociaux
    * derniers tweets des critères (track+lang) sélectionnés
    * derniers commentaires de la vidéo Facebook Live sélectionnée
    * bouton ON AIR pour affichage sur l‘habillage

![Administration](/doc/admin.jpg)

## Installation

L'exemple est prévu pour Debian GNU/Linux avec systemd. L'app marche aussi sous MacOS à l'exception des services systemd. Sans doute sous MS Windows aussi (non testé).

```bash
cd /var/www
git clone https://github.com/aerogus/overlay-engine.git .
cd overlay-engine
cp conf/settings.json.dist conf/settings.json
vi conf/settings.json
cp conf/grid.json.dist conf/grid.json
vi conf/grid.json
npm install
cp services/overlay-engine-server.service /etc/systemd/system
systemctl daemon-reload
systemctl enable overlay-engine-server
systemctl start overlay-engine-server
crontab services/crontab
```

Le fichier de conf principal : `conf/settings.json`: 

```json
{
  "server": {
    "PORT": 80,
    "HOST": "overlay-engine-host"
  },
  "twitter": {
    "CONSUMER_KEY": "",
    "CONSUMER_SECRET": "",
    "ACCESS_TOKEN_KEY": "",
    "ACCESS_TOKEN_SECRET": ""
  },
  "facebook": {
    "APP_ID": "",
    "APP_SECRET": ""
  }
}
```

Les paramètres obligatoires sont `server.PORT` et `server.host` à renseigner.

Les 3 webapps sont sur http://overlay-engine-host, http://overlay-engine-host/admin

### Récupération de l'émission courante (obligatoire)

Par crontab, l'app `app/watch-show.js` est lancée toutes les minutes.

La source de données est `conf/grid.json` qui doit être modifié manuellement. C'est une grille de programme hebdomadaire.

```json
{
  "monday":    { "0000-2400": "Nom de l'émission" },
  "tuesday":   { "0000-2400": "Nom de l'émission" },
  "wednesday": { "0000-2400": "Nom de l'émission" },
  "thursday":  { "0000-2400": "Nom de l'émission" },
  "friday":    { "0000-2400": "Nom de l'émission" },
  "saturday":  { "0000-2400": "Nom de l'émission" },
  "sunday":    { "0000-2400": "Nom de l'émission" }
}
```

### Récupération du titre/artiste en cours (optionnel)

```bash
systemctl enable overlay-engine-watch-song
systemctl start overlay-engine-watch-song
```

L'app `app/watch-song.js` doit être adaptée, spécifier le fichier source des données et le parser correctement.

### Récupération des commentaires et réactions d'un Facebook Live (optionnel)

Pour récupérer en temps réel les commentaires et réactions d'un Facebook Live, il vous faut créer une app Facebook.

* Créer une app FB sur https://developers.facebook.com/
* Récupérer l'identifiant d'app + la clé secrète dans "Paramètres" / "Général"
* L'app doit être "en ligne" (= pas "en développement")

```bash
systemctl start overlay-engine-watch-fb-comments@1234
systemctl start overlay-engine-watch-fb-reactions@1234
```

ou

```bash
cd /var/www/overlay-engine
npm run watch-fb-comments 1234
npm run watch-fb-reactions 1234
```

L'app `app/watch-fb-comments.js` prend 1 paramètre (1234), l'id de la vidéo facebook live
L'app `app/watch-fb-reactions.js` prend 1 paramètre (1234), l'id de la vidéo facebook live

éditer dans `settings.json` la valeur de `settings.facebook.APP_ID` et `settings.facebook.APP_SECRET`.

### Récupération des tweets (optionnel)

Pour les messages sociaux twitter, vous devez avoir un compte sur cette plateforme, avoir créé une "app"
et récupéré vos identifiants `CONSUMER_KEY`, `CONSUMER_SECRET`, `TOKEN_KEY` et `ACCESS_TOKEN_SECRET` et les saisir dans `settings.json`, section `twitter`.

L'app prend en paramètres :
* n°1 (obligatoire) `TRACKS` avec les hashtags et les comptes à suivre, séparés par des virgules. Ex: "@twitter,#twitter,#music"
* n°2 (optionnel) `LANGUAGE`, filtrage par langue (défaut: `fr`).

puis

```bash
systemctl enable overlay-engine-watch-tweets
systemctl start overlay-engine-watch-tweets
```

ou

```bash
cd /var/www/overlay-engine
npm run watch-tweets "@twitter,#twitter,#music" "fr"
```

## Type de messages websocket

* Tous les messages clients sont techniquement émis vers le serveur, le tableau ci-dessous est une vue simplifiée des échanges principaux
* Les clients n'écoutent que les messages qui les intéressent

Nom     | Expéditeur         | Destinataire | Description
------- | ------------------ | ------------ | -----------
TWI     | watch-tweets       | server       | Message issu de la stream API twitter
FBL_COM | watch-fb-comments  | server       | Commentaire issu d'un Facebook Live
FBL_REA | watch-fb-reactions | server       | Réaction issu d'un Facebook Live
SOC     | server             | wall         | Message social, format commun multi source
SOC_AIR | wall               | habillage    | Afficher le message social modéré
SOC_REA | server             | habillage    | Afficher les réactions des réseaux sociaux
ZIK     | watch-title        | habillage    | Info de début de nouvelle chanson, mode auto
ZIK     | admin              | habillage    | Info de début de nouvelle chanson, mode manuel
EMI     | watch-show         | habillage    | Infos sur l'émission courante
TLX     | admin              | habillage    | ajoute un message telex + broadcaste tous les messages telex
TLX_DEL | admin              | server       | efface un message telex + broadcaste tous les messages telex
DMP     | client             | client       | client demandant le dump mémoire du serveur
