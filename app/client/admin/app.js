/**
 * Module d‘admin
 * exporte la classe
 */

/*globals settings, $, io */

'use strict';

class App {

  constructor() {

    this.options = {
      // serveur temps réel
      WEBSOCKET_SERVER: settings.ws
    };

    this.UI = {
      flash_msg: '#message_response',
      dump: {
        screen: '#var_screen',
        social: '#var_social',
        telex: '#var_telex',
        show: '#var_show',
        music: '#var_music',
        edito: '#var_edito'
      }
    };

    this.initSongSendButton();
    this.initTelexSendButton();
    this.initTelexDeleteButtons();

    this.socket = io(this.options.WEBSOCKET_SERVER);
    this.socket.emit('DMP');

    this.socket.on('connect', () => {
      console.log(`[OK] connected to ${this.options.WEBSOCKET_SERVER}`);
      this.flash(`Connecté à ${this.options.WEBSOCKET_SERVER}`);
    });

    this.socket.on('connect_error', () => {
      console.log(`[KO] ${this.options.WEBSOCKET_SERVER} not launched`);
    });

    this.socket.on('disconnect', () => {
      console.log(`[OK] disconnected from ${this.options.WEBSOCKET_SERVER}`);
      this.flash('Déconnecté');
    });

    // réception du dump initial de la mémoire
    this.socket.on('DMP', dump => {
      console.log('DMP received');
      console.debug(dump);
      this.updateDumpUI(dump);
    });

    // réception d'un message social brut
    this.socket.on('SOC', (social) => {
      console.log('SOC received', social);
    });

    // liste des messages entrainant un rafraichissement de l‘interface d‘admin
    const msgs_with_refresh = [
      'ZIK', 'EMI', 'SCR', 'TLX', 'EDI', 'PSO', 'USO'
    ];

    msgs_with_refresh.forEach(msg => {
      this.socket.on(msg, () => {
        // émet un dump pour mettre à jour les composants d'UI
        this.socket.emit('DMP');
      });
    });
  }

  initSongSendButton() {
    $('#live_song_send').click((e) => {
      e.preventDefault();
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
   *
   * @param object data
   */
  updateDumpUI(data) {

    $(this.UI.dump.screen).html(data.screen.toString());

    let show = $('<ul/>');
    for (let key in data.show) {
      if (data.show.hasOwnProperty(key)) {
        let li = $('<li/>', {
          text: key + ': ' + data.show[key]
        });
        show.append(li);
      }
    }
    $(this.UI.dump.show).empty().append(show);

    let music = $('<ul/>');
    for (let key in data.music) {
      if (data.music.hasOwnProperty(key)) {
        let li = $('<li/>', {
          text: key + ': ' + data.music[key]
        });
        music.append(li);
      }
    }
    $(this.UI.dump.music).empty().append(music);

    let social = $('<ul/>');
    data.social.forEach(item => {
      let li = $('<li/>', { 'data-key': item.key })
        .append($('<button/>', { text: 'Del' } ))
        .append($('<span/>', { text: item.text } ));
      social.append(li);
    });
    $(this.UI.dump.social).empty().append(social);

    let telex = $('<ul/>');
    data.telex.forEach(item => {
      let li = $('<li/>', { 'data-id': item.id })
        .append($('<button/>', { text: 'Del' }).addClass('delete'))
        .append($('<span/>', { text: item.content } ));
      telex.append(li);
    });
    $(this.UI.dump.telex).empty().append(telex);

    let edito = $('<ul/>');
    data.edito.forEach(item => {
      let li = $('<li/>', {
        text: item.img
      });
      edito.append(li);
    });
    $(this.UI.dump.edito).empty().append(edito);

  }

  /**
   * Affichage d'un message éclair
   *
   * @param string message
   */
  flash(message) {
    $(this.UI.flash_msg).html(message).show().delay(500).fadeOut();
  }
}

module.exports = App;
