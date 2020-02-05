#!/usr/bin/env node

/**
 * envoi de l‘événement SOC à chaque nouveau message
 */

const Twitter = require('twitter');
const settings = require('./lib/settings')
  , log = require('./lib/log');

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
const socket = io('ws://' + settings.server.HOST + ':' + settings.server.PORT, {autoConnect: false, reconnectionAttempts: 2});

client.stream('statuses/filter', {track: settings.twitter.TRACK, language: settings.twitter.LANGUAGE}, (stream) => {

  stream.on('data', (tweet) => {
    if (!tweet.id) return;
    if (isReply(tweet)) return;
    if (tweet.is_quote_status) return;

    const social = {
      avatar: (tweet.user.default_profile_image ? 'https://abs.twimg.com/sticky/default_profile_images/default_profile_bigger.png' : tweet.user.profile_image_url_https.replace('_normal', '_bigger')),
      name: tweet.user.name + ' @' + tweet.user.screen_name,
      network: 'twitter',
      message: (tweet.truncated ? tweet.extended_tweet.full_text : tweet.text)
    };

    // exclure les messages avec des liens ?
    //if (social.message.match(/(https:\/\/t.co)/)) return;

    log(social);
    log('-');

    socket.open();

    socket.on('connect', () => {
      socket.emit('SOC', social);
      log('SOC emitted');
      socket.disconnect();
    });

    socket.on('connect_error', () => {
      log('connexion WS impossible');
      socket.disconnect();
    });

  });

  stream.on('error', (error) => {
    log(error);
  });

});