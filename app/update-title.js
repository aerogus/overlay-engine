#!/usr/bin/env node

/**
 * envoi de l'événement ZIK à chaque changement de chanson
 * poll régulier sur l'url d'info titre/artiste courant de BLP Radio
 */

'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const request = require('request');

const settings = require('./lib/settings')
  , log = require('./lib/log');

const TITLE_URL = 'http://www.blpradio.fr/sam/livetitle.php';

// parser du livetitle.php
const regexp = /<h5>([^>]+)<\/h5><h6>([^>]+)<H6><\/p><div class="meter red animate"><span style="width: ([^>]+)"><\/span>/;

// attention, format:
// <div id="liveEmission"><strong>Flash Infos (RFI)</strong></div>

const tempo = 10; // temporisation entre 2 poll, en secondes

let song = { // objet chanson
  'artist': 'Artiste',
  'title': 'Titre',
  'img': 'img/artistes/default.jpg',
  'length': 60000 // en ms. mini 60000 (durée animation)
};

const io = require('socket.io-client');
const socket = io('ws://' + settings.server.HOST + ':' + settings.server.PORT, {autoConnect: false, reconnectionAttempts: 2});

(function update_title() {
  let timer;
  request(TITLE_URL, (err, res, body) => {
    if (err) { return console.log(err); }
    let extract = body.match(regexp);
    if (extract === null) { return log('livetitle non parsable'); }
    let artist = extract[1];
    let title = extract[2];
    let percent = extract[3];
    if ((artist !== song.artist) || (title !== song.title)) {
      log(artist + ' - ' + title); // nouvelle chanson !
      song.artist = artist;
      song.title = title;
      socket.open();
      socket.on('connect', () => {
        socket.emit('ZIK', song);
        log('ZIK emitted');
        socket.disconnect();
      });
      socket.on('connect_error', () => {
        log('connexion WS impossible');
        socket.disconnect();
      });
    } else {
      log('-');
    }
  });
  timer = setTimeout(update_title, tempo * 1000);
})();
