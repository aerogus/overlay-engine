/**
 * Live Social Wall
 */

/*globals settings, $, io */

'use strict';

class App {

  constructor() {
    this.options = {
      WEBSOCKET_SERVER: settings.ws,
      MAX_ITEMS: 100
    };

    this.social = [];

    this.socket = io(this.options.WEBSOCKET_SERVER);
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

    // réception du dump initial de la mémoire
    this.socket.on('dumped', dump => {
      console.log('dump received');
      this.social = dump.social;
      this.initUI(this.social);
      this.initOnAirButtons();
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
  }

  /**
   * chargement initial des données
   */
  initUI() {
    this.social.forEach((item) => {
      this.pushSocialUI(item);
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
                width: 80,
                height: 80,
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
          title: 'Mettre ce tweet à l‘écran'
        })
        .addClass('btn')
        .append('ON AIR')
      )
      .prependTo('.wall');
  }

  /**
   * envoi du msg SOC_AIR sur le tweet sélectionné
   */
  initOnAirButtons() {
    $('body').on('click', '.btn', (e) => {
      //e.preventDefault();
      console.log('click');
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

}

module.exports = App;
