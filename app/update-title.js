#!/usr/bin/env node

'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const request = require('request');
const settings = require('./settings');

const TITLE_URL = 'http://www.blpradio.fr/sam/livetitle.php';

let timer; // timer
let tempo = 10; // temporisation entre 2 poll, en secondes

let song = { // objet chanson
  'artist': 'Artiste',
  'title': 'Titre',
  'img': 'img/artistes/default.jpg',
  'length': 60000 // en ms. mini 60000 (durée animation)
};

const regexp = /<h5>([^>]+)<\/h5><h6>([^>]+)<H6><\/p><div class="meter red animate"><span style="width: ([^>]+)"><\/span>/;

const socket = require('socket.io-client')('ws://' + settings.ws.host + ':' + settings.ws.port);

socket.on('connect', () => {
  (function update_title() {
    request(TITLE_URL, (err, res, body) => {
      if (err) { return console.log(err); }
      let extract = body.match(regexp);
      let artist = extract[1];
      let title = extract[2];
      let percent = extract[3];
      console.log(artist + ' - ' + title + ' (' + percent + ')');
      if ((artist !== song.artist) || (title !== song.title)) {
        song.artist = artist;
        song.title = title;
        socket.emit('ZIK', song);
        console.log('ZIK emitted');
      }
    });
    timer = setTimeout(update_title, tempo * 1000);
  })();
});
