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
   * Affichage du logo ?
   * @var bool
   */
  logo: true,

  /**
   * Affichage de l'horloge ?
   * @var bool
   */
  clock: true,

  /**
   * Affichage du telex ?
   * @var bool
   */
  footer: true,

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
   * Liste des messages sociaux
   * @var array d'objets .avatar, .name, .network, .message
   */
  social: [{
    avatar: 'https://pbs.twimg.com/profile_images/1039188008543678464/3dzfOoBY_bigger.jpg',
    name: 'Aurélien Taché',
    screen_name: '@Aurelientache',
    text: 'Très fier que #LesMiserables soient aux #Oscars2020. J‘espère de tout coeur que cette œuvre majeure, sur le plan cinématographique, comme sur celui de la lutte contre les #discriminations, sera primée. Et que ceux qui ont diffamés un homme qui a purgé sa peine, seront condamnés.'
  }, {
    avatar: 'https://pbs.twimg.com/profile_images/835778286731022337/kdE5YWci_bigger.jpg',
    name: 'Le Fraik',
    screen_name: '@leFraik',
    text: 'Dévoiler la chanson titre de #NoTimeToDie aux #Oscars2020 ça aurait pas un peu de la gueule quand même ?....#BillieEilish #jamesbond'
  }],

  /**
   * Message social à afficher
   */
  tweet: {
    avatar: 'https://pbs.twimg.com/profile_images/835778286731022337/kdE5YWci_bigger.jpg',
    name: 'Le Fraik',
    screen_name: '@leFraik',
    text: 'Dévoiler la chanson titre de #NoTimeToDie aux #Oscars2020 ça aurait pas un peu de la gueule quand même ?....#BillieEilish #jamesbond'
  },

  /**
   * nombre max de telex à stocker
   * @var int
   */
  MAX_TELEX: 10,

  /**
   * Liste des telex
   *
   * @var array de strings
   */
  telex: [],

  /**
   * Chargement initial des données
   */
  load() {
    log('data.load');
    this.show = show.getCurrent();

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

    // ajoute un message au début du tableau
    this.social.unshift(social);

    // limite la taille du tableau, efface le plus ancien messahe social
    if (this.social.length > this.MAX_SOCIAL) {
      this.social.pop();
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
      tweet: this.tweet,
      telex: this.telex,
      logo: this.logo,
      clock: this.clock,
      footer: this.footer
    };
  }
};
