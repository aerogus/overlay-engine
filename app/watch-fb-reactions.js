#!/usr/bin/env node

/**
 * Récupération des commentaires d'un FB Live
 *
 * Todo créer une app FB sur https://developers.facebook.com/
 * et récupérer l'identifiant d'app + la clé secrète dans "Paramètres" / "Général"
 * L'app doit être "en ligne" (pas "en développement")
 */

'use strict';

const EventSource = require('eventsource')
  , request = require('request')
  , io = require('socket.io-client');

const settings = require('./lib/settings')
  , log = require('./lib/log');

const socket = io(`ws://${settings.server.HOST}:${settings.server.PORT}`);

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
  log('connexion WS impossible');
});

socket.on('connect', () => {
  log('connecté');
  if (settings.facebook.USER_ACCESS_TOKEN) {
    log('via user access token');
    startWatching(settings.facebook.VIDEO_ID, settings.facebook.USER_ACCESS_TOKEN);
  } else {
    log('via app access token');
    // url pour récupérer l'app access token
    const FB_APP_ACCESS_TOKEN_URL= `https://graph.facebook.com/oauth/access_token?client_id=${settings.facebook.APP_ID}&client_secret=${settings.facebook.APP_SECRET}&grant_type=client_credentials`;
    log(FB_APP_ACCESS_TOKEN_URL);
    request.get({url: FB_APP_ACCESS_TOKEN_URL, json: true}, (err, res, data) => {
      if (err) {
        log('Error:', err);
      } else {
        startWatching(settings.facebook.VIDEO_ID, data.access_token);
      }
    });
  }
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

    log(data.reaction_stream);
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
      data.reaction_stream.forEach(item => {
        reactions[item.key] = item.value;
      });
      firstLoop = false;
    } else {
      data.reaction_stream.forEach(item => {
        let diff = item.value - reactions[item.key];
        reactions[item.key] += diff;
        if (diff > 0) {
          for (let i = 0 ; i < diff ; i++) {
            socket.emit('FBL_REA', {
              type: item.key
            });
            log(`FBL_REA emitted (${item.key})`);
          }
        }
      });
    }
  };
}