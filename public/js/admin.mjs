/**
 * Module d‘admin
 * exporte la classe
 */

/*globals settings, $, io */

'use strict';

export class App {

  constructor() {

    this.data = {};

    this.options = {
      // serveur temps réel
      WEBSOCKET_SERVER: settings.ws
    };

    this.UI = {
      dump: {
        logo: '#var_logo',
        social: '#var_social',
        telex: '#var_telex',
        show: '#var_show',
        music: '#var_music',
      }
    };

    this.initToggleLogo();
    this.initToggleClock();
    this.initToggleTelex();
    this.initSongSendButton();
    this.initTelexSendButton();
    this.initTelexDeleteButtons();

    this.socket = io(this.options.WEBSOCKET_SERVER);
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

    // réception du dump initial de la mémoire
    this.socket.on('DMP', dump => {
      console.log('DMP received');
      this.data = dump;
      console.debug(dump);
      this.updateUI();
    });

    // réception d'un message social brut
    this.socket.on('SOC', (social) => {
      console.log('SOC received', social);
    });

    // liste des messages entrainant un rafraichissement de l‘interface d‘admin
    const msgs_with_refresh = [
      'ZIK', 'EMI', 'TLX', 'EDI', 'PSO', 'USO'
    ];

    msgs_with_refresh.forEach(msg => {
      this.socket.on(msg, () => {
        // émet un dump pour mettre à jour les composants d'UI
        this.socket.emit('DMP');
      });
    });
  }

  initToggleLogo() {
    $('#admin_logo').click((e) => {
      e.preventDefault();
      this.data.logo = !this.data.logo;
      this.socket.emit('LOGO', this.data.logo);
    });
  }

  initToggleClock() {
    $('#admin_clock').click((e) => {
      e.preventDefault();
      this.data.clock = !this.data.clock;
      this.socket.emit('CLOCK', this.data.clock);
    });
  }

  initToggleTelex() {
    $('#admin_telex').click((e) => {
      e.preventDefault();
      this.data.footer = !this.data.footer;
      this.socket.emit('TELEX', this.data.footer);
    });
  }

  initSongSendButton() {
    $('#live_song_send').click((e) => {
      e.preventDefault();
      if (!$('#live_song_artist').val().length && !$('#live_song_title').val().length) {
        return;
      }
      let song = {
        artist: $('#live_song_artist').val(),
        title: $('#live_song_title').val()
      };
      this.socket.emit('ZIK', song);
      console.log('ZIK', song);
      $('#live_song_artist').val('');
      $('#live_song_title').val('');
    });
  }

  initTelexSendButton() {
    $('#live_telex_send').click((e) => {
      e.preventDefault();
      let content = $('#live_telex_content').val();
      this.socket.emit('TLX', content);
      console.log('TLX', content);
      $('#live_telex_content').val('');
    });
  }

  initTelexDeleteButtons() {
    $('#var_telex').on('click', 'button', (e) => {
      e.preventDefault();
      let id = $(e.currentTarget).parent().data('id');
      this.socket.emit('TLX_DEL', id);
      console.log('TLX_DEL', id);
    });
  }

  /**
   * mise à jour de l'affichage des variables serveur
   */
  updateUI() {

    let show = $('<ul/>');
    for (let key in this.data.show) {
      if (this.data.show.hasOwnProperty(key)) {
        let li = $('<li/>', {
          text: key + ': ' + this.data.show[key]
        });
        show.append(li);
      }
    }
    $(this.UI.dump.show).empty().append(show);

    let music = $('<ul/>');
    for (let key in this.data.music) {
      if (this.data.music.hasOwnProperty(key)) {
        let li = $('<li/>', {
          text: key + ': ' + this.data.music[key]
        });
        music.append(li);
      }
    }
    $(this.UI.dump.music).empty().append(music);

    let social = $('<ul/>');
    this.data.social.forEach(item => {
      let li = $('<li/>', { 'data-key': item.key })
        .append($('<button/>', { text: 'Del' } ))
        .append($('<span/>', { text: item.text } ));
      social.append(li);
    });
    $(this.UI.dump.social).empty().append(social);

    let telex = $('<ul/>');
    this.data.telex.forEach(item => {
      let li = $('<li/>', { 'data-id': item.id })
        .append($('<button/>', { text: '' }).addClass('delete'))
        .append($('<span/>', { text: item.content } ));
      telex.append(li);
    });
    $(this.UI.dump.telex).empty().append(telex);
  }
}
