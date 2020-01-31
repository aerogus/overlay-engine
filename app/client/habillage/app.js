/**
 * Module d'habillage
 */

/*globals settings, $, io, moment */

'use strict';

let animClock = require('./anim-clock')
  , animOnair = require('./anim-onair')
  , truncate = require('./truncate');

class App {

  constructor() {

    this.options = {
      // serveur temps réel
      WEBSOCKET_SERVER: settings.ws
    };

    /**
     * nombre de messages sociaux à stocker
     * @var int
     */
    this.MAX_SOCIAL = 30;

    /**
     * nombre de news à stocker
     * @var int
     */
    this.MAX_NEWS = 30;

    /**
     * Taille max d'un titre de news
     * @var int
     */
    this.MAX_NEWS_LENGTH = 88;

    /**
     * les données du serveur
     * @var object
     */
    this.data = {
      music: {},
      show: {},
      social: [],
      news: [],
      ads: []
    };

    // éléments de l'interface
    this.UI = {
      clock: '#clock'
    };

    // les différents minuteurs
    this.timer = {
      social: false,
      ads: false,
      news: false
    };

    // les différentes temporisation (en sec.)
    this.tempo = {
      social: 7,
      ads: 20,
      news: 5
    };

    // nombres aléatoires
    this.random_index = {
      news: null,
      ads: null,
      social: null
    };

    // les composants sont-ils bien chargés ?
    this.ready = {
      music: false,
      show: false,
      social: false,
      ads: false
    };

    // écrans courant et précédent
    this.screen = {
      current: '',
      previous: ''
    };

    this.socket = io.connect(this.options.WEBSOCKET_SERVER);
    this.socket.emit('dump');

    this.socket.on('connect', () => {
      console.log('[OK] connected to ' + this.options.WEBSOCKET_SERVER);
    });

    this.socket.on('connect_error', () => {
      console.log('[KO] ' + this.options.WEBSOCKET_SERVER + ' not launched');
    });

    this.socket.on('disconnect', () => {
      console.log('[OK] disconnected from ' + this.options.WEBSOCKET_SERVER);
    });

    // à la réception du dump initial de la mémoire
    this.socket.on('dumped', dump => {
      console.log('dump received');

      this.data.music = dump.music;
      this.updateMusicUI();

      this.data.show = dump.show;
      this.updateShowUI();

      this.data.social = dump.social;
      this.initSocialUI();

      this.data.news = dump.news;
      this.initNewsUI();

      this.data.ads = dump.ads;
      this.initAdsUI();

      this.requestScreen(dump.screen);
    });

    // changement d'écran
    this.socket.on('screen', screen => {
      console.log('switch to screen ' + screen);
      this.requestScreen(screen);
    });

    // début nouvelle chanson
    this.socket.on('ZIK', music => {
      console.log('ZIK');
      console.debug(music);
      this.data.music = music;
      this.updateMusicUI();
    });

    // début nouvelle émission
    this.socket.on('EMI', show => {
      console.log('EMI');
      console.debug(show);
      this.data.show = show;
      this.updateShowUI();
    });

    // réception pack de sliders
    this.socket.on('ADS', ads => {
      console.log('ADS');
      console.debug(ads);
      this.data.ads = ads;
      this.updateAdsUI();
    });

    // nouveau message social reçu
    this.socket.on('SOC', social => {
      console.log('SOC');
      console.debug(social);
      this.addSocial(social);
    });

    // modération d'un message social
    this.socket.on('SOCDEL', key => {
      console.log('SOCDEL');
      console.debug(key);
      this.delSocial(key);
    });

    // nouvelle news publiée
    this.socket.on('NWS', news => {
      console.log('NWS');
      console.debug(news);
      this.addNews(news);
    });

    // rechargement de la page
    this.socket.on('UPD', () => {
      location.reload(true);
    });

    this.animClock = animClock;
    this.animOnair = animOnair;

    this.initClock();
    this.initReadyListeners();
    this.initKeyboard();
  }

  /**
   * Horloge
   * Calcule toutes les secondes et mise à jour de l'UI si besoin
   */
  initClock() {
    let clock = $(this.UI.clock);
    let animClock = this.animClock;
    (function clock_update_ui() {
      let now = new Date();
      let hour = ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2);
      if (clock.html() !== hour) {
        clock.html(hour);
        animClock.start();
      }
      setTimeout(clock_update_ui, 1000);
    })();
  }

  /**
   * On ne déclenche le changement d'écran qu'une fois tous les composants chargés
   */
  initReadyListeners() {
    $('body').on('musicReady showReady socialReady adsReady screenRequested', () => {
      if (this.ready.music && this.ready.show && this.ready.social && this.ready.ads) {
        console.debug(this.ready);
        // rien à faire si on ne change pas d'écran
        if (this.screen.current === this.screen.previous) {
          return;
        }
        $('#' + this.screen.previous + '-screen').hide();
        $('#' + this.screen.current + '-screen').show();
      }
    });
  }

  /**
   * contrôle au clavier pour debug
   */
  initKeyboard() {
    $(document).bind('keypress', (e) => {
      switch (e.which) {
        case 49: // touche 1
          this.requestScreen('onair');
          break;
        case 50: // touche 2
          this.requestScreen('music');
          break;
        case 51: // touche 3
          this.requestScreen('ads');
          break;
        case 102: // touche F pour fullscreen
          document.documentElement.requestFullscreen();
          break;
      }
    });
  }

  /**
   * demande d'affichage d'un nouvel écran
   * set de la variable système puis trigge requestScreen
   *
   * @param string screen
   */
  requestScreen(screen) {

    console.log('requestScreen ' + screen);

    this.screen.previous = this.screen.current;
    this.screen.current = screen;

    $('body').trigger('requestScreen');

  }

  /**
   * Charge les ressources relatives à une émission,
   * met à jour les composants relatifs cette émission
   * trigge l'événement showReady
   */
  updateShowUI() {

    this.ready.show = false;

    $('#show')
      .css('backgroundColor', this.data.show.color)
      .css('color', this.data.show.color_alt)
      .html(this.data.show.title);

    // durée de l'émission en sec.
    let start = moment(this.data.show.start);
    let end = moment(this.data.show.end);
    let duration = end.diff(start) / 1000;

    // durée écoulée depuis le début de l'émission en sec.
    let now = moment();
    let elapsed = now.diff(start) / 1000;

    // positionnement css
    let max_offset = parseInt($('#line').css('width').replace('px', '')) - parseInt($('#cursor').css('width').replace('px', ''));
    let ratio = elapsed / duration;
    ratio = (ratio > 1) ? 1 : ratio;
    ratio = (ratio < 0) ? 0 : ratio;
    let offset = max_offset * ratio;

    $('#start').html(start.format('HH[H]mm'));
    $('#end').html(end.format('HH[H]mm'));
    $('#cursor').css('left', offset + 'px');

    this.ready.show = true;
    $('body').trigger('showReady');

  }

  /**
   * met à jour les composants relatifs à la chanson en cours
   * déclenché à l'init + réception msg ZIK
   */
  updateMusicUI() {

    this.ready.music = false;

    // on attend que l'image soit chargée
    let artiste = new Image();
    artiste.onload = () => {
      $('#music-screen .background').css('backgroundImage', 'url(' + this.data.music.img + ')');
      $('#music-screen .pano').css('backgroundImage', 'url(' + this.data.music.img + ')');
      this.ready.music = true;
      console.log('trigger musicReady');
      $('body').trigger('musicReady');
      let do_expand_visuel = (this.screen.current === 'onair');
      this.animOnair.start(this.data.music, do_expand_visuel);
    };
    artiste.src = this.data.music.img;

  }

  /**
   * met à jour les composants relatifs aux sliders
   */
  updateAdsUI() {

    this.ready.ads = false;

    // @todo: on attend que toutes les images des pubs soient chargées

    this.ready.ads = true;
    console.log('trigger adsReady');
    $('body').trigger('adsReady');

  }

  /**
   * met à jour le bandeau des news + init de la boucle
   *
   * @param array arr [] .title
   */
  initNewsUI() {

    if (!this.data.news.length) {
      return;
    }

    let _this = this;
    (function news_update_ui() {
      if (_this.data.news.length > 1) {
        let random_index = _this.random_index.news;
        do {
          _this.random_index.news = Math.floor(Math.random() * _this.data.news.length);
        } while (_this.random_index.news === random_index); // anti doublon consécutif
      } else {
        _this.random_index.news = 0;
      }
      // décodage html via jQuery ...
      let content = $('<textarea/>').html(_this.data.news[_this.random_index.news].title).text();
      $('.news__title').hide().html(truncate(content, _this.MAX_NEWS_LENGTH)).fadeIn(300);
      _this.timer.news = setTimeout(news_update_ui, _this.tempo.news * 1000);
    })();

  }

  /**
   * met à jour le composant social + init de la boucle
   */
  initSocialUI() {

    this.ready.social = false;
    let _this = this;
    (function social_update_ui() {
      console.log('social length = ' + _this.data.social.length);
      if (!_this.data.social.length) {
        _this.ready.social = true;
        $('.social_wrap').css('opacity', 0);
        $('body').trigger('socialReady');
      } else {
        $('.social_wrap').css('opacity', 1);
        if (_this.data.social.length > 1) {
          let random_index = _this.random_index.social;
          do {
            _this.random_index.social = Math.floor(Math.random() * _this.data.social.length);
          } while (_this.random_index.social === random_index); // anti doublon consécutif
        } else {
          _this.random_index.social = 0;
        }
        let avatar = new Image();
        avatar.onload = () => {
          console.log('avatar image loaded');
          let network = new Image();
          network.onload = () => {
            console.log('network image loaded');
            $('.social img.avatar').hide().attr('src', _this.data.social[_this.random_index.social].avatar).fadeIn(300);
            $('.social img.network').hide().attr('src', 'img/' + _this.data.social[_this.random_index.social].network + '.svg').fadeIn(300);
            $('.social h3').hide().html(_this.data.social[_this.random_index.social].name).fadeIn(300);
            $('.social span').hide().html(_this.data.social[_this.random_index.social].message).fadeIn(300);
            _this.ready.social = true;
            console.log('trigger socialReady');
            $('body').trigger('socialReady');
          };
          network.src = 'img/' + _this.data.social[_this.random_index.social].network + '.svg';
        };
        avatar.src = _this.data.social[_this.random_index.social].avatar;
      }
      _this.timer.social = setTimeout(social_update_ui, _this.tempo.social * 1000);
    })();

  }

  /**
   * met à jour le composant ads + init de la boucle
   */
  initAdsUI() {
    let _this = this;
    (function ads_update_ui() {
      if (!_this.data.ads.length) {
        _this.ready.ads = true;
        $('body').trigger('adsReady');
      } else {
        _this.ready.ads = false;
        console.log('ads length = ' +  _this.data.ads.length);
        if (_this.data.ads.length > 1) {
          let random_index = _this.random_index.ads;
          do {
            _this.random_index.ads = Math.floor(Math.random() * _this.data.ads.length);
          } while (_this.random_index.ads === random_index); // anti doublon consécutif
        } else {
          _this.random_index.ads = 0;
        }
        let ads = new Image();
        ads.onload = () => {
          console.log('onload OK');
          $('#ads-screen .background').css('backgroundImage', 'url(' + _this.data.ads[_this.random_index.ads].img + ')');
          $('#ads-screen .pano').css('backgroundImage', 'url(' + _this.data.ads[_this.random_index.ads].img + ')');
          _this.ready.ads = true;
          console.log('trigger adsReady');
          $('body').trigger('adsReady');
        };
        ads.src = _this.data.ads[_this.random_index.ads].img;
        console.log('--- : ' + ads.src);
      }
      _this.timer.ads = setTimeout(ads_update_ui, _this.tempo.ads * 1000);
    })();

  }

  /**
   * Ajoute une news au tableau
   *
   * @var object news .title
   */
  addNews(news) {
    // ajoute une news au début du tableau
    this.data.news.unshift(news);

    // limite la taille du tableau, efface la plus ancienne news
    if (this.data.news.length > this.MAX_NEWS) {
      this.data.news.pop();
    }
  }

  /**
   * Ajoute un message social au tableau
   *
   * @var object social .key .provider .message .avatar .date
   */
  addSocial(social) {
    // ajoute un message au début du tableau
    this.data.social.unshift(social);

    // limite la taille du tableau, efface le plus ancien message social
    if (this.data.social.length > this.MAX_SOCIAL) {
      this.data.social.pop();
    }
  }

  /**
   * Retire un message social du tableau, identifié par sa clé
   *
   * @var string key
   */
  delSocial(key) {
    if (!this.data.social.length) {
      return;
    }

    this.data.social = this.data.social.filter(item => item.key !== key);
  }
}

module.exports = App;
