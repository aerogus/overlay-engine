/**
 * Module d‘admin
 * exporte la classe
 */

/* globals console, settings, $, io */

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

    this.initToggleUIButtons();
    this.initPushSongButton();
    this.initTelexButtons();
    this.initSocialOnAirButtons();

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

  initToggleUIButtons() {
    $('#admin_logo').click((e) => {
      e.preventDefault();
      this.data.ui.logo = !this.data.ui.logo;
      this.updateUIToggleLogo();
      this.socket.emit('UI_LOGO', this.data.ui.logo);
    });
    $('#admin_clock').click((e) => {
      e.preventDefault();
      this.data.ui.clock = !this.data.ui.clock;
      this.updateUIToggleClock();
      this.socket.emit('UI_CLOCK', this.data.ui.clock);
    });
    $('#admin_telex').click((e) => {
      e.preventDefault();
      this.data.ui.telex = !this.data.ui.telex;
      this.updateUIToggleTelex();
      this.socket.emit('UI_TELEX', this.data.ui.telex);
    });
    $('#admin_reactions').click((e) => {
      e.preventDefault();
      this.data.ui.reactions = !this.data.ui.reactions;
      this.updateUIToggleReactions();
      this.socket.emit('UI_REACTIONS', this.data.ui.reactions);
    });
    $('#admin_autosong').click((e) => {
      e.preventDefault();
      this.data.ui.autosong = !this.data.ui.autosong;
      this.updateUIToggleAutosong();
      this.socket.emit('UI_AUTOSONG', this.data.ui.autosong);
    });
  }

  updateUIToggleLogo() {
    if (this.data.ui.logo) $('#admin_logo').removeClass('off');
    else $('#admin_logo').addClass('off');
  }

  updateUIToggleClock() {
    if (this.data.ui.clock) $('#admin_clock').removeClass('off');
    else $('#admin_clock').addClass('off');
  }

  updateUIToggleTelex() {
    if (this.data.ui.telex) $('#admin_telex').removeClass('off');
    else $('#admin_telex').addClass('off');
  }

  updateUIToggleReactions() {
    if (this.data.ui.reactions) $('#admin_reactions').removeClass('off');
    else $('#admin_reactions').addClass('off');
  }

  updateUIToggleAutosong() {
    if (this.data.ui.autosong) $('#admin_autosong').removeClass('off');
    else $('#admin_autosong').addClass('off');
  }

  initPushSongButton() {
    $('#live_song_send').click((e) => {
      e.preventDefault();
      // on push que s'il y a des données
      if (!$('#live_song_artist').val().length && !$('#live_song_title').val().length) {
        return;
      }
      const song = {
        artist: $('#live_song_artist').val(),
        title: $('#live_song_title').val(),
        from: 'admin'
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
  initSocialOnAirButtons() {
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
      .prependTo('.wall');
  }

  /**
   * mise à jour global de l'affichage avec l'état des variables serveur
   */
  updateUI() {
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

    this.updateUIToggleLogo();
    this.updateUIToggleClock();
    this.updateUIToggleTelex();
    this.updateUIToggleReactions();
    this.updateUIToggleAutosong();
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
