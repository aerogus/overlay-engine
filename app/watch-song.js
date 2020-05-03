#!/usr/bin/env node

/**
 * envoi de l'événement ZIK à chaque nouvelle chanson
 * poll régulier sur l'url d'info titre/artiste courant de BLP Radio
 */

'use strict';

const io = require('socket.io-client')
  , settings = require('./lib/settings')
  , log = require('./lib/log')
  , music = require('./lib/music');

const tempo = 10; // temporisation entre 2 poll, en secondes
const socket = io(`ws://${settings.server.HOST}:${settings.server.PORT}`, {autoConnect: false, reconnectionAttempts: 2});

const currentSong = { // objet chanson
  'artist': '',
  'title': '',
};

(function update_title() {
  let timer;
  music.getCurrent()
    .then(newSong => {
      // anti doublon
      if ((currentSong.artist !== newSong.artist) || (currentSong.title !== newSong.title)) {
        log(newSong.artist + ' - ' + newSong.title);
        currentSong.artist = newSong.artist;
        currentSong.title = newSong.title;
        socket.open();
        socket.on('connect', () => {
          socket.emit('ZIK', currentSong);
          log('ZIK emitted');
          socket.disconnect();
        });
        socket.on('connect_error', () => {
          log('connexion impossible, service overlay-engine-server bien lancé ?');
          socket.disconnect();
        });
      } else {
        log('-');
      }
    });
  timer = setTimeout(update_title, tempo * 1000);
})();
