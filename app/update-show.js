#!/usr/bin/env node

/**
 * envoi de l‘événement EMI à chaque changement d‘émission
 * à exécuter toutes les 5 minutes (à xxhx0 et xxhx5)
 * via crontab
 */

const settings = require('./lib/settings')
  , log = require('./lib/log')
  , show = require('./lib/show');

// si début de nouvelle émission, envoyer les infos au serveur
let newShow = show.isNew();
if (newShow) {
  log('début émission ' + show.title);
  const io = require('socket.io-client');
  const socket = io('ws://' + settings.server.HOST + ':' + settings.server.PORT, {autoConnect: false, reconnectionAttempts: 2});
  socket.open();
  socket.on('connect', () => {
    socket.emit('EMI', newShow);
    log('EMI emitted');
    socket.disconnect();
  });
  socket.on('connect_error', () => {
    log('connexion WS impossible');
    socket.disconnect();
  });
} else {
  log('pas de début d‘émission');
}
