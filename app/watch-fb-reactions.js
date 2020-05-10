#!/usr/bin/env node

/**
 * Récupération des commentaires d'un FB Live
 *
 * Todo créer une app FB sur https://developers.facebook.com/
 * et récupérer l'identifiant d'app + la clé secrète dans "Paramètres" / "Général"
 * L'app doit être "en ligne" (pas "en développement")
 *
 * Usage:
 * npm start watch-fb-reactions videoId
 */

'use strict';

const EventSource = require('eventsource')
  , request = require('request')
  , io = require('socket.io-client');

const settings = require('./lib/settings')
  , log = require('./lib/log');

const socket = io(`ws://${settings.server.HOST}:${settings.server.PORT}`);

let videoId = '';
if (process.argv[2]) {
  videoId = process.argv[2];
} else {
  log('videoId manquant');
  process.exit(1);
}

log(`video ${videoId}`);

let firstLoop = true;

// compteurs locaux des réactions
const reactions = {
  LIKE: 0,
  LOVE: 0,
  HAHA: 0,
  WOW: 0,
  SAD: 0,
  ANGRY: 0,
};

socket.on('connect_error', () => {
  log('connexion impossible, service overlay-engine-server bien lancé ?');
});

socket.on('connect', () => {
  log('connecté à overlay-engine-server');
  // url pour récupérer l'app access token
  const FB_APP_ACCESS_TOKEN_URL= `https://graph.facebook.com/oauth/access_token?client_id=${settings.facebook.APP_ID}&client_secret=${settings.facebook.APP_SECRET}&grant_type=client_credentials`;
  log(FB_APP_ACCESS_TOKEN_URL);
  request.get({url: FB_APP_ACCESS_TOKEN_URL, json: true}, (err, res, data) => {
    if (err) {
      log('Error:', err);
    } else {
      startWatching(videoId, data.access_token);
    }
  });
});

function startWatching(videoId, accessToken) {
  // Graph API URL
  const FB_LIVE_REACTIONS_URL = `https://streaming-graph.facebook.com/${videoId}/live_reactions?access_token=${accessToken}&fields=reaction_stream`;
  log(FB_LIVE_REACTIONS_URL);
  var es = new EventSource(FB_LIVE_REACTIONS_URL);
  es.onerror = (err) => {
    console.log(err);
  };
  es.onmessage = (event) => {
    let data = JSON.parse(event.data);
    /*
    // on reçoit un tableau tableau de compteurs
    reaction_stream: [
      { key: 'LIKE', value: 40094 },
      { key: 'LOVE', value: 75249 },
      { key: 'HAHA', value: 116219 },
      { key: 'WOW', value: 7858 },
      { key: 'SAD', value: 107 },
      { key: 'ANGRY', value: 116 }
    ]
    */

    if (firstLoop) {
      // 1ère boucle, on se contente de récupérer l'état des compteurs
      data.reaction_stream.forEach(item => {
        reactions[item.key] = item.value;
      });
      log(reactions);
      firstLoop = false;
    } else {
      // boucles suivantes, on calcule les deltas et on émet les événements nécessaires
      data.reaction_stream.forEach(item => {
        let diff = item.value - reactions[item.key];
        reactions[item.key] += diff;
        if (diff > 0) {
          for (let i = 0 ; i < diff ; i++) {
            let reaction = {
              type: item.key,
              network: 'facebook',
              timestamp: new Date()
            };
            socket.emit('FBL_REA', reaction);
            log('FBL_REA emitted:');
            log(reaction);
          }
        }
      });
    }
  };
}
