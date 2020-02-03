#!/usr/bin/env node

/**
 * envoi de l‘événement EMI à chaque changement d‘émission
 * à exécuter toutes les 5 minutes (à xxhx0 et xxhx5)
 * via crontab
 */

const fs = require('fs')
  , moment = require('moment');

const settings = require('./lib/settings')
  , log = require('./lib/log')
  , gridFile = __dirname + '/../grid.json';

const grid = JSON.parse(fs.readFileSync(gridFile, 'utf8'));

const dayName = moment().format('dddd').toLowerCase();
const currentTime = moment().format('hhmm');

let startMTS, endMTS, showLength, newShow = false, show = {};

// début de nouvelle émission ?
for (let [showTimes, showTitle] of Object.entries(grid[dayName])) {
  let [startTime, endTime] = showTimes.split('-');
  if (startTime === currentTime) {
    // en millitimestamp
    startMTS = (startTime.substr(0, 2) * 3600 + startTime.substr(2, 2) * 60) * 1000;
    endMTS = (endTime.substr(0, 2) * 3600 + endTime.substr(2, 2) * 60) * 1000;
    showLength = endMTS - startMTS; 
    log('début émission ' + showTitle + ' durée (ms) = ' + showLength);
    newShow = true;
    show = {
      title: showTitle,
      color: '#bfa267',
      color_alt: '#ffffff',
      start: startMTS,
      end: endMTS
    };
  }
}

// si oui, envoyer les infos au serveur
if (newShow) {
  const io = require('socket.io-client');
  const socket = io('ws://' + settings.server.HOST + ':' + settings.server.PORT, {autoConnect: false, reconnectionAttempts: 2});
  socket.open();
  socket.on('connect', () => {
    socket.emit('EMI', show);
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
