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

const settings = require('./settings');
const socket = require('socket.io-client')('ws://' + settings.ws.host + ':' + settings.ws.port);

socket.on('connect', () => {

  switch (msg) {

    // début chanson
    case 'ZIK':
      socket.emit('ZIK', {
        artist: 'OÜI FM',
        title: '#ROCKRADIO',
        img: 'https://www.ouifm.fr/wp-content/uploads/artistes/the-rolling-stones.jpg',
        length: 160000 // 1 min
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
        avatar: 'https://pbs.twimg.com/profile_images/831548575125483522/k9Kukioo.jpg',
        name: 'Clément Potier @clem_oui_fm',
        network: 'twitter',
        message: '@Arnold_Officiel @ouifm oui en effet, la protubérance nasale touche les 3 micros en même temps. Je tente de gérer ça avec la technique.'
      });
      console.log('SOC emitted');
      break;

    // nouvelle modération d'un message
    case 'SOCDEL':
      break;

    // infos de l'émission courante
    case 'EMI':
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
