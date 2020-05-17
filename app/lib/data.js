/**
 * Structure des données en mémoire + état initial
 */

'use strict';

let sha1 = require('sha1')
  , moment = require('moment');

let log = require('./log')
  , settings = require('./settings')
  , music = require('./music')
  , show = require('./show');

module.exports = {

  /**
   * Affichage des modules d'UI
   * @var object
   */
  ui: {
    logo: true,
    clock: true,
    footer: true,
    reactions: true,
    autosong: true,
  },

  /**
   * Objet musique / pige courante
   * @var object
   */
  music: {
    artist: 'BLP Radio',
    title: 'La Webradio du Nord Essonne',
    img: `http://${settings.server.HOST}:${settings.server.PORT}/img/music/default.jpg`,
    length: 60000 // mini 60 sec (doit être > durée de l'animation)
  },

  /**
   * Objet show / émission courante
   * @var object
   */
  show: {
    title: 'BLP Radio',
    color: '#dfa14d',
    color_alt: '#ffffff',
    start: moment().startOf('day').unix() * 1000,
    end: (moment().endOf('day').unix() + 1) * 1000
  },

  /**
   * Liste des derniers messages sociaux reçus
   * @var array d'objets .avatar, .name, .network, .message, .timestamp
   */
  social: [],

  /**
   * message social actuellement ON AIR
   */
  social_air: {},

  /**
   * nombre max de messages sociaux à stocker
   * @var int
   */
  MAX_SOCIAL: 100,

  /**
   * Liste des telex
   *
   * @var array de strings
   */
  telex: [],

  /**
   * nombre max de telex à stocker
   * @var int
   */
  MAX_TELEX: 10,

  /**
   * Chargement initial des données
   */
  load() {
    log('data.load');
    this.show = show.getCurrent();
    this.addTelex('Welcome to Overlay Engine Telex');

    log('show');
    log(this.show);
    music.getCurrent()
      .then(song => {
        this.music = song;
        log('music');
        log(this.music);
      }, error => {
        log(error);
      });
  },

  /**
   * Ajoute un telex au tableau
   *
   * @var string msg
   */
  addTelex(msg) {
    let telex = {
      id: sha1(JSON.stringify(msg)),
      content: msg
    };

    // ajoute un telex au début du tableau
    this.telex.unshift(telex);

    // limite la taille du tableau, efface le plus ancien telex
    if (this.telex.length > this.MAX_TELEX) {
      this.telex.pop();
    }
  },

  /**
   * Efface le message social du tableau, identifié par sa clé
   *
   * @var string id
   */
  delTelex(id) {
    if (!this.telex.length) {
      return;
    }

    this.telex = this.telex.filter(item => item.id !== id);
  },

  /**
   * Ajoute un message social au tableau
   * @var object social .provider .message .avatar .date
   */
  addSocial(social) {
    // on identifie le message par un hash pour potentiellement le modérer
    social.key = sha1(JSON.stringify(social));

    // ajoute un message à la fin du tableau
    this.social.push(social);

    // limite la taille du tableau, efface le plus ancien message social
    if (this.social.length > this.MAX_SOCIAL) {
      this.social.shift();
    }
  },

  /**
   * Efface le message social du tableau, identifié par sa clé
   * @var string key
   */
  delSocial(key) {
    if (!this.social.length) {
      return;
    }

    this.social = this.social.filter(item => item.key !== key);
  },

  /**
   * Retourne l'ensemble des données
   *
   * @return object
   */
  dump() {
    return {
      music: this.music,
      show: this.show,
      social: this.social,
      social_air: this.social_air,
      tweet: this.tweet,
      telex: this.telex,
      ui: this.ui,
    };
  }
};
