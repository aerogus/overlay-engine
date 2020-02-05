/**
 * Structure des données en mémoire + état initial
 */

'use strict';

let sha1 = require('sha1')
  , moment = require('moment');

let log = require('./log')
  , settings = require('./settings')
  , show = require('./show');

module.exports = {

  /**
   * État des micros
   * @var bool
   */
  mic: true,

  /**
   * État de la publicité
   * @var bool
   */
  pub: false,

  /**
   * État du mode always on
   * @var bool
   */
  always: false,

  /**
   * Nom de l'écran courant
   * @var string
   */
  screen: 'music',

  /**
   * Objet musique / pige courante
   * @var object
   */
  music: {
    artist: 'BLP Radio',
    title: 'La Webradio du Nord Essonne',
    img: 'http://' + settings.server.HOST + ':' + settings.server.PORT + '/img/music/default.jpg',
    length: 60000 // mini 60 sec (doit être > durée de l'animation)
  },

  /**
   * Objet musique au démarrage de la pub
   * @var object
   */
  music_pon: {
    artist: 'DANS UN INSTANT',
    title: 'LE RETOUR DU ROCK',
    img: 'http://' + settings.server.HOST + ':' + settings.server.PORT + '/img/music/default.jpg',
    length: 180000 // moyenne de 3 min
  },

  /**
   * Objet musique à la fin de la pub
   * /!\ POF est souvent envoyé après ZIK
   * @var object
   */
  music_pof: {
    artist: 'ROCK RADIO',
    title: 'OUI FM',
    img: 'http://' + settings.server.HOST + ':' + settings.server.PORT + '/img/music/default.jpg',
    length: 60000 // mini 60 sec (doit être > durée de l'animation)
  },

  /**
   * Objet show / émission courante
   * @var object
   */
  show: {
    title: 'BLP Radio',
    color: '#bfa267',
    color_alt: '#ffffff',
    start: moment().startOf('day').unix() * 1000,
    end: (moment().endOf('day').unix() + 1) * 1000
  },

  /**
   * nombre de messages sociaux à stocker
   * @var int
   */
  MAX_SOCIAL: 30,

  /**
   * Liste des messages sociaux
   * @var array d'objets .avatar, .name, .network, .message
   */
  social: [{
    avatar: 'https://pbs.twimg.com/profile_images/1039188008543678464/3dzfOoBY_bigger.jpg',
    name: 'Aurélien Taché @Aurelientache',
    network: 'twitter',
    message: `Très fier que #LesMiserables soient aux #Oscars2020. J'espère de tout coeur que cette œuvre majeure, sur le plan cinématographique, comme sur celui de la lutte contre les #discriminations, sera primée. Et que ceux qui ont diffamés un homme qui a purgé sa peine, seront condamnés.`
  }, {
    avatar: 'https://pbs.twimg.com/profile_images/835778286731022337/kdE5YWci_bigger.jpg',
    name: `Le Fraik' @leFraik`,
    network: 'twitter',
    message: 'Dévoiler la chanson titre de #NoTimeToDie aux #Oscars2020 ça aurait pas un peu de la gueule quand même ?....#BillieEilish #jamesbond'
  }],

  /**
   * Liste des publicités (= sliders)
   * @var array d'objets .img
   */
  ads: [{
    img: 'http://' + settings.server.HOST + ':' + settings.server.PORT + '/img/ads/default.jpg'
  }, {
    img: 'http://' + settings.server.HOST + ':' + settings.server.PORT + '/img/ads/default.jpg'
  }, {
    img: 'http://' + settings.server.HOST + ':' + settings.server.PORT + '/img/ads/default.jpg'
  }],

  /**
   * nombre de news à stocker
   * @var int
   */
  MAX_NEWS: 30,

  /**
   * Liste des derniers articles du site
   * @var array d'objets .title
   */
  news: [{
    title: 'Toutes les semaines, JJBEN vous propose 1/2 heure de chroniques: séries TV, films, albums...'
  }, {
    title: 'Live spécial cérémonie des Oscars 2020 toute la nuit'
  }, {
    title: 'La webradio du Nord Essonne'
  }],

  /**
   * Chargement initial des données
   */
  load() {
    log('data.load');
    this.show = show.getCurrent();
    this.computeScreen();
  },

  /**
   * Ajoute une news au tableau
   * @var object news .title
   */
  addNews(news) {
    // ajoute une news au début du tableau
    this.news.unshift(news);

    // limite la taille du tableau, efface la plus ancienne news
    if (this.news.length > this.MAX_NEWS) {
      this.news.pop();
    }
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
   * Calcule l'écran à afficher en fonction des états et des impulsions
   * et met à jour data.screen
   *
   * @return bool true si screen à changé, false sinon
   */
  computeScreen() {
    let new_screen;
    if (this.always || this.mic) {
      new_screen = 'onair';
    } else if (this.pub) {
      new_screen = 'ads';
    } else {
      new_screen = 'music';
    }
    if (this.screen !== new_screen) {
      console.log('switch to screen ' + new_screen);
      this.screen = new_screen;
      return true;
    }
    return false;
  },

  /**
   * Retourne l'ensemble des données
   *
   * @return object
   */
  dump() {
    return {
      mic: this.mic,
      pub: this.pub,
      always: this.always,
      screen: this.screen,
      music: this.music,
      show: this.show,
      social: this.social,
      ads: this.ads,
      news: this.news
    };
  }
};
