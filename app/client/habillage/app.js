/**
 * Module d'habillage
 */

/*globals settings, $, io, moment, Telex */

'use strict';

let animClock = require('./anim-clock')
  , animSong = require('./anim-song')
  , animSocial = require('./anim-social');

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
    this.MAX_SOCIAL = 10;

    /**
     * nombre de news à stocker
     * @var int
     */
    this.MAX_TELEX = 10;

    /**
     * les données du serveur
     * @var object
     */
    this.data = {
      screen: '',
      music: {},
      show: {},
      social: [],
      social_air: {},
      telex: [],
      edito: []
    };

    // éléments de l'interface
    this.UI = {
      clock: '#clock'
    };

    // les différents minuteurs
    this.timer = {
      social: false,
      edito: false,
    };

    // les différentes temporisation (en sec.)
    this.tempo = {
      edito: 20,
    };

    // écrans courant et précédent
    this.screen = {
      current: '',
      previous: ''
    };

    this.qtx = {};

    this.socket = io.connect(this.options.WEBSOCKET_SERVER);
    this.socket.emit('dump');

    this.socket.on('connect', () => {
      console.log(`[OK] connected to ${this.options.WEBSOCKET_SERVER}`);
    });

    this.socket.on('connect_error', () => {
      console.log(`[KO] ${this.options.WEBSOCKET_SERVER} not launched`);
    });

    this.socket.on('disconnect', () => {
      console.log(`[OK] disconnected from ${this.options.WEBSOCKET_SERVER}`);
    });

    // à la réception du dump initial de la mémoire
    this.socket.on('dumped', dump => {
      console.log('dump received');
      console.log(dump);

      this.data.music = dump.music;
      this.updateMusicUI();

      this.data.show = dump.show;
      this.updateShowUI();

      this.data.tweet = dump.tweet;
      this.initSocialUI();

      this.data.telex = dump.telex;
      this.initTelex();

      this.data.edito = dump.edito;
      this.initEditoUI();

      this.switchToScreen(dump.screen);
    });

    // changement d'écran
    this.socket.on('screen', screen => {
      console.log(`switch to screen ${screen}`);
      this.switchToScreen(screen);
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

    // réception pack d'infos éditoriales
    this.socket.on('EDI', edi => {
      console.log('edi');
      console.debug(edi);
      this.data.edi = edi;
      this.updateEdiUI();
    });

    // nouveau message social modéré reçu
    this.socket.on('SOC_AIR', social => {
      console.log('SOC_AIR');
      console.debug(social);
      this.data.social_air = social;
      this.animSocial.start(this.data.social_air);
    });

    // maj telex
    this.socket.on('TLX', telex => {
      console.log('TLX');
      console.debug(telex);
      this.data.telex = telex;
      if (!this.qtx && this.data.telex.length) {
        this.qtx = Telex.widget('tx', { speed: 100 }, this.data.telex);
        this.qtx.messages = this.data.telex;
      }
    });

    // rechargement complet de la page
    this.socket.on('UPD', () => {
      location.reload(true);
    });

    this.animClock = animClock;
    this.animSocial = animSocial;
    this.animSong = animSong;

    this.initClock();
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
   * telex
   * @see https://github.com/sjaakp/telex
   */
  initTelex() {
    console.log('initTelex');
    if (this.data.telex.length) {
      this.qtx = Telex.widget('tx', { speed: 100 }, this.data.telex);
    }
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
          this.requestScreen('offair');
          break;
        case 102: // touche F pour fullscreen
          document.documentElement.requestFullscreen();
          break;
      }
    });
  }

  /**
   * change d‘écran
   *
   * @param string screen
   */
  switchToScreen(screen) {

    console.log(`switchToScreen ${screen}`);

    this.screen.previous = this.screen.current;
    this.screen.current = screen;

    $('#' + this.screen.previous + '-screen').hide();
    $('#' + this.screen.current + '-screen').show();

  }

  /**
   * Charge les ressources relatives à une émission,
   * met à jour les composants relatifs cette émission
   */
  updateShowUI() {

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
  }

  /**
   * met à jour les composants relatifs à la chanson en cours
   * déclenché à l'init + réception msg ZIK
   */
  updateMusicUI() {
    this.animSong.start(this.data.music);
  }

  /**
   * met à jour les composants relatifs aux photos éditoriales
   */
  updateEditoUI() {
  }

  /**
   * met à jour le composant social + init de la boucle
   */
  initSocialUI() {
    this.animSocial.start(this.data.social_air);
    $('.social_wrap').removeClass('expanded').addClass('folded');
  }

  /**
   * met à jour le composant edito + init de la boucle
   */
  initEditoUI() {
    let _this = this;
    let random_index = Math.floor(Math.random() * _this.data.edito.length);
    (function edito_update_ui() {
      if (_this.data.edito.length) {
        console.log('edito length = ' +  _this.data.edito.length);
        random_index =  Math.floor(Math.random() * _this.data.edito.length);
        let edito = new Image();
        edito.onload = () => {
          console.log('onload OK');
          $('#edito-screen .background').css('backgroundImage', 'url(' + _this.data.edito[random_index].img + ')');
          $('#edito-screen .pano').css('backgroundImage', 'url(' + _this.data.edito[random_index].img + ')');
        };
        edito.src = _this.data.edito[random_index].img;
        console.log('--- : ' + edito.src);
      }
      _this.timer.edito = setTimeout(edito_update_ui, _this.tempo.edito * 1000);
    })();

  }
}

module.exports = App;
