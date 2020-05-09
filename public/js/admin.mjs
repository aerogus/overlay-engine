/**
 * Module d‘admin
 * exporte la classe
 */

/*globals settings, $, io */

'use strict';

export class App {

  constructor() {

    this.data = {};

    this.social = [];

    this.options = {
      // serveur temps réel
      WEBSOCKET_SERVER: settings.ws,
      MAX_ITEMS: 100
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
    this.initTelexButtons();
    this.initOnAirButtons();

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
      this.social.push(social);
      this.pushSocialUI(social);
      if (this.social.length > this.options.MAX_ITEMS) {
        this.social.shift(); // retire le 1er élément (+ ancien)
      }
      if ($('.social').length > this.options.MAX_ITEMS) {
        $('.social:last-child').remove();
      }
    });

    // liste des messages entrainant un rafraichissement de l‘interface d‘admin
    const msgs_with_refresh = [
      'ZIK', 'EMI', 'TLX', 'TLX_DEL'
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
      // on push que s'il y a des données
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

  initTelexButtons() {
    $('#telex_list').on('click', 'button', (e) => {
      e.preventDefault();
      if ($(e.currentTarget).hasClass('add')) {
        // ajout d'un message telex
        let input = $(e.currentTarget).parent().find('input');
        if (input.val()) {
          this.socket.emit('TLX', input.val());
          console.log('TLX', input.val());
          input.val('');
          this.addTelexInput();
        }
      } else if ($(e.currentTarget).hasClass('del')) {
        // suppression d'un message telex
        if ($(e.currentTarget).parent().parent().find('li').length > 2) {
          let li = $(e.currentTarget).parent();
          this.socket.emit('TLX_DEL', li.data('id'));
          console.log('TLX_DEL', li.data('id'));
          this.delTelexInput(li.data('id'));
        }
      }
    });
  }

  /**
   * envoi du msg SOC_AIR sur le tweet sélectionné
   */
  initOnAirButtons() {
    $('body').on('click', '.btn', (e) => {
      e.preventDefault();
      let social = {
        key: $(e.currentTarget).parent().data('key'),
        avatar: $(e.currentTarget).parent().find('.soc_avatar')[0].src,
        name: $(e.currentTarget).parent().find('.soc_name').text(),
        screen_name: $(e.currentTarget).parent().find('.soc_screen_name').text(),
        text: $(e.currentTarget).parent().find('.soc_text').text()
      };

      // filtrage urls
      social.text = social.text.replace(/(?:https?):\/\/[\n\S]+/g, '');

      this.socket.emit('SOC_AIR', social);
      console.log('SOC_AIR', social);
    });
  }

  /**
   * ajoute un message au dom
   * 
   * @param object social
   */
  pushSocialUI(social) {
    $('<div/>', {
      'data-key': social.key
    })
      .addClass('social')
      .append(
        $('<div/>')
          .addClass('soc_hdr')
          .append(
              $('<img/>', {
                src: social.avatar,
                alt: ''
              })
              .addClass('soc_avatar')
          )
          .append(
              $('<div/>')
                .addClass('soc_hdr_meta')
                .append(
                    $('<div/>')
                      .addClass('soc_name')
                      .append(social.name)
                )
                .append(
                    $('<div/>')
                      .addClass('soc_screen_name')
                      .append(social.screen_name)
                )
            )
      )
      .append(
        $('<div/>')
          .addClass('soc_text')
          .append(social.text)
      )
      .append(
        $('<button/>', {
          title: 'Mettre ce message à l‘écran'
        })
        .addClass('btn')
        .append('ON AIR')
      )
      .appendTo('.wall');
  }

  /**
   * mise à jour de l'affichage des variables serveur
   */
  updateUI() {
/*
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
*/
/*
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
*/
/*
    let social = $('<ul/>');
    this.data.social.forEach(item => {
      let li = $('<li/>', { 'data-key': item.key })
        .append($('<button/>', { text: 'Del' } ))
        .append($('<span/>', { text: item.text } ));
      social.append(li);
    });
    $(this.UI.dump.social).empty().append(social);
*/
    let telex_list = $('#telex_list');
    telex_list.empty();
    this.data.telex.forEach(item => {
      let li = $('<li/>', { 'data-id': item.id }).addClass('telex-msg')
        .append($('<input/>', { type: 'text', readonly: 'readonly', placeholder: 'Texte', value: item.content }))
        .append($('<button/>').addClass('del'));
      telex_list.append(li);
    });
    this.addTelexInput();

    $('.wall').empty();
    this.data.social.forEach((item) => {
      this.pushSocialUI(item);
    });
  }

  addTelexInput() {
    let telex_list = $('#telex_list');
    let li_add = $('<li/>').addClass('telex-msg')
      .append($('<input/>', { type: 'text', placeholder: 'Texte' }))
      .append($('<button/>').addClass('add'));
    telex_list.append(li_add);
  }

  delTelexInput(id) {
    $('#telex_list').filter('[data-id="' + id + '"]').remove();
  }
}
