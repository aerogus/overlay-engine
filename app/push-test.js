#!/usr/bin/env node

/**
 * Script d'envoi de messages de test au serveur
 */

'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

if (process.env.NODE_ENV !== 'development') {
  console.log('authorized only on development environnement');
  process.exit(-1);
}

if (process.argv.length <= 2) {
  console.log('Usage: ' + __filename + ' ZIK|ZON|ZOF|MON|MOF|UPD|NWS|SOC|SOCDEL|EMI|ADS|AON|AOF|PON|POF');
  process.exit(-1);
}

let msg = process.argv[2];

const settings = require('./lib/settings');
const socket = require('socket.io-client')('ws://' + settings.server.HOST + ':' + settings.server.PORT);

socket.on('connect', () => {

  switch (msg) {

    // début chanson
    case 'ZIK':
      socket.emit('ZIK', {
        artist: 'Artiste',
        title: 'Titre',
        img: 'http://' + settings.server.HOST + ':' + settings.server.PORT + '/img/artistes/default.jpg',
        length: 60000 // en ms. mini 60000 (durée animation)
      });
      console.log('ZIK emitted');
      break;

    // activation mode plein gaz / Beats1 Always on
    case 'ZON':
      socket.emit('ZON');
      console.log('ZON emitted');
      break;

    // désactivation mode plein gaz / Beats1 Always on
    case 'ZOF':
      socket.emit('ZOF');
      console.log('ZOF emitted');
      break;

    // activation des micros
    case 'AON':
      socket.emit('AON');
      console.log('AON emitted');
      break;

    // désactivation des micros
    case 'AOF':
      socket.emit('AOF');
      console.log('AOF emitted');
      break;

      // activation mode maintenance
    case 'MON':
      socket.emit('MON');
      console.log('MON emitted');
      break;

    // désactivation mode maintenance
    case 'MOF':
      socket.emit('MOF');
      console.log('MOF emitted');
      break;

    // demande mise à jour de l'habillage côté client
    case 'UPD':
      break;

    // nouvelle news
    case 'NWS':
      socket.emit('NWS', {
        title: 'BPL Radio - La webradio du Nord Essonne'
      });
      console.log('NWS emitted');
      break;

    // nouveau message social
    case 'SOC':
      socket.emit('SOC', {
        avatar: 'https://pbs.twimg.com/profile_images/1039188008543678464/3dzfOoBY_400x400.jpg',
        name: 'Aurélien Taché @Aurelientache',
        network: 'twitter',
        message: 'Très fier que #LesMiserables soient aux #Oscars2020.'
      });
      console.log('SOC emitted');
      break;

    // nouvelle modération d'un message
    case 'SOCDEL':
      break;

    // début nouvelle émission
    case 'EMI':
      socket.emit('EMI', {
        title: 'Nom Émission',
        color: '#bfa267',
        color_alt: '#ffffff',
        hashtag: 'blpradio',
        horaire: '0H-24H',
        start: Date.now() - 3600 * 1000,
        end: Date.now() + 3600 * 1000
      });
      console.log('EMI emitted');
      break;

    // bloc de sliders
    case 'ADS':
      console.log('message ' + msg + ' not implemented');
      break;

    default:
      console.log('unknown message ' + msg);
      break;
  }

  socket.disconnect();
});
