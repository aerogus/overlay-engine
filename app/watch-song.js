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
const socket = io(`ws://${settings.server.HOST}:${settings.server.PORT}`);

const currentSong = { // objet chanson
  'artist': '',
  'title': '',
};

(function update_title() {
  music.getCurrent()
    .then(newSong => {
      // anti doublon
      if ((currentSong.artist !== newSong.artist) || (currentSong.title !== newSong.title)) {
        log(newSong.artist + ' - ' + newSong.title);
        currentSong.artist = newSong.artist;
        currentSong.title = newSong.title;
        currentSong.from = 'autosong';
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
  setTimeout(update_title, tempo * 1000);
})();
