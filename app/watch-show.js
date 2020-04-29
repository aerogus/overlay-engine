#!/usr/bin/env node

/**
 * envoi de l‘événement EMI avec l'objet "show" de l'émission courante
 * à exécuter régulièrement par cron
 */

'use strict';

const settings = require('./lib/settings')
  , log = require('./lib/log')
  , show = require('./lib/show');

let currentShow = show.getCurrent();
log('ON AIR: ' + currentShow.title);

const io = require('socket.io-client');
const socket = io(`ws://${settings.server.HOST}:${settings.server.PORT}`, {reconnectionAttempts: 2});

socket.on('connect', () => {
  socket.emit('EMI', currentShow);
  log('EMI emitted');
  socket.disconnect();
});

socket.on('connect_error', () => {
  log('connexion WS impossible');
});
