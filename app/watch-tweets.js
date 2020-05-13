#!/usr/bin/env node

/**
 * envoi de l‘événement TWI à chaque nouveau tweet reçu
 * 
 * Usage:
 * npm start watch-tweets "hashtag1,hashtag2,..." "language"
 */

'use strict';

const Twitter = require('twitter')
  , axios = require('axios')
  , fs = require('fs')
  , sha1 = require('sha1');

const settings = require('./lib/settings')
  , log = require('./lib/log');

const AVATAR_PATH = __dirname + '/../public/img/avatars';

function isReply(tweet) {
  if ( tweet.retweeted_status
    || tweet.in_reply_to_status_id
    || tweet.in_reply_to_status_id_str
    || tweet.in_reply_to_user_id
    || tweet.in_reply_to_user_id_str
    || tweet.in_reply_to_screen_name )
    return true;
}

let client = new Twitter({
  consumer_key: settings.twitter.CONSUMER_KEY,
  consumer_secret: settings.twitter.CONSUMER_SECRET,
  access_token_key: settings.twitter.ACCESS_TOKEN_KEY,
  access_token_secret: settings.twitter.ACCESS_TOKEN_SECRET
});

const io = require('socket.io-client');
const socket = io(`ws://${settings.server.HOST}:${settings.server.PORT}`);

let track = '';
if (process.argv[2]) {
  track = process.argv[2];
} else {
  log('track manquant');
  process.exit(1);
}

let language = 'fr';
if (process.argv[3]) {
  language = process.argv[3];
}

socket.on('connect_error', () => {
  log('connexion impossible, service overlay-engine-server bien lancé ?');
});

socket.on('connect', () => {
  log('connecté');
  client.stream('statuses/filter', {track, language}, (stream) => {

    stream.on('data', (tweet) => {
      if (!tweet.id) return;
      if (isReply(tweet)) return;
      if (tweet.is_quote_status) return;

      const social = {
        avatar: '',
        name: tweet.user.name,
        screen_name: `@${tweet.user.screen_name}`,
        text: (tweet.truncated ? tweet.extended_tweet.full_text : tweet.text),
        network: 'twitter',
        timestamp: new Date()
      };

      // filtrage des urls
      social.text = social.text.replace(/(?:https?):\/\/[\n\S]+/g, '');

      if (tweet.user.default_profile_image) {
        social.avatar = '/img/avatars/tw-default.png';
        pushSocial(social);
      } else {
        let AVATAR_FILE = `tw-${tweet.user.id_str}.jpg`;
        if (fs.existsSync(`${AVATAR_PATH}/${AVATAR_FILE}`)) {
          log('avatar TW déjà en cache');
          social.avatar = `/img/avatars/${AVATAR_FILE}`;
          pushSocial(social);
        } else {
          const TW_AVATAR_URL = tweet.user.profile_image_url_https.replace('_normal', '_bigger');
          log(`récupération avatar TW ${TW_AVATAR_URL}`);
          axios.get(TW_AVATAR_URL, {responseType: 'arraybuffer'})
            .then(resp => {
              log('avatar TW mis en cache');
              fs.writeFileSync(`${AVATAR_PATH}/${AVATAR_FILE}`, resp.data, 'binary');
              social.avatar = `/img/avatars/${AVATAR_FILE}`;
              pushSocial(social);
            })
            .catch(err => {
              log('Error:', err);
            });
        }
      }

    });

    stream.on('error', (error) => {
      log(error);
    });

  });

});

function pushSocial(social) {
  social.key = sha1(JSON.stringify(social));
  socket.emit('TWI', social);
  log('TWI emitted:');
  log(social);
}