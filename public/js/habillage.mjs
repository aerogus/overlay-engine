/**
 * Module d'habillage
 */

/*globals settings, $, io, moment, Telex */

'use strict';

import {animClock} from './habillage-anim-clock.mjs';
import {animSong} from './habillage-anim-song.mjs';
import {animSocial} from './habillage-anim-social.mjs';

export class App {

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
      music: {},
      show: {},
      social: [],
      social_air: {},
      telex: []
    };

    // éléments de l'interface
    this.UI = {
      clock: '#clock'
    };

    // les différents minuteurs
    this.timer = {
      social: false
    };

    // les différentes temporisation (en sec.)
    this.tempo = {
      edito: 20,
    };

    this.qtx = {};

    this.socket = io.connect(this.options.WEBSOCKET_SERVER);
    this.socket.emit('DMP');

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
    this.socket.on('DMP', dump => {
      console.log('DMP received');
      console.log(dump);

      this.data.music = dump.music;
      this.updateMusicUI();

      this.data.show = dump.show;
      this.updateShowUI();

      this.data.tweet = dump.tweet;
      this.initSocialUI();

      this.data.telex = dump.telex;
      this.initTelex();
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

    // nouveau message social modéré reçu
    this.socket.on('SOC_AIR', social => {
      console.log('SOC_AIR');
      console.debug(social);
      this.data.social_air = social;
      this.animSocial.start(this.data.social_air);
    });

    // nouvelle réaction d'un réseau social reçue
    this.socket.on('SOC_REA', reaction => {
      console.log('SOC_REA');
      console.log(reaction);
      this.printReaction(reaction.type.toLowerCase());
    });

    // maj telex
    this.socket.on('TLX', telex => {
      console.log('TLX');
      console.debug(telex);
      this.data.telex = telex;
      if (!this.qtx && this.data.telex.length) {
        this.qtx = Telex.widget('tx', { speed: 100 }, this.data.telex);
      }
      if (this.data.telex.length) {
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
        case 102: // touche F pour fullscreen
          document.documentElement.requestFullscreen();
          break;
      }
    });
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
   * met à jour le composant social + init de la boucle
   */
  initSocialUI() {
    this.animSocial.start(this.data.social_air);
    $('.social_wrap').removeClass('expanded').addClass('folded');
  }

  /**
   * dessine une nouvelle réaction à l'écran
   */
  printReaction(reaction) {
    let x = Math.floor(Math.random() * (1920 - 32)); // 32 = icon width
    let y = Math.floor(Math.random() * (1080 - 32)); // 32 = icon height
    $('<div class="icon ' + reaction + '" style="left:' + x + 'px;top:' + y + 'px"></div>')
      .appendTo('#global')
      .delay(2000)
      .queue(function() {
        $(this).remove();
      });
  }
}
