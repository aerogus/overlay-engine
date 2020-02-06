/**
 * Module d'admin l'application
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

    this.initConnectButtons();
    this.initMessageButtons();
    this.initInfoBulle();

    this.socket = io(this.options.WEBSOCKET_SERVER);
    this.socket.emit('dump');

    this.socket.on('connect', () => {
      console.log(`[OK] connected to ${this.options.WEBSOCKET_SERVER}`);
      $('#conx').removeClass('disconnected').addClass('connected');
      $('#conx').html('Se déconnecter');
      this.flash(`Connecté à ${this.options.WEBSOCKET_SERVER}`);
    });

    this.socket.on('connect_error', () => {
      console.log(`[KO] ${this.options.WEBSOCKET_SERVER} not launched`);
    });

    this.socket.on('disconnect', () => {
      console.log(`[OK] disconnected from ${this.options.WEBSOCKET_SERVER}`);
      $('#conx').removeClass('connected').addClass('disconnected');
      $('#conx').html('Se connecter');
      this.flash('Déconnecté');
    });

    // à la réception du dump initial de la mémoire
    this.socket.on('dumped', dump => {
      console.log('dump received');
      console.debug(dump);
      this.updateDumpUI(dump);
    });

    this.socket.on('SOC', (social) => {
      console.log('SOC received', social);
    });

    // liste des messages entrainant un rafraichissement de l'interface
    const msgs_with_refresh = [
      'ZIK', 'EMI', 'SCR', 'TLX', 'EDI', 'PSO', 'USO'
    ];

    msgs_with_refresh.forEach(msg => {
      this.socket.on(msg, () => {
        this.socket.emit('dump');
      });
    });
  }

  /**
   * Gestion du bouton de connexion
   */
  initConnectButtons() {
    $('#conx').click(() => {
      if (this.socket.connected) {
        this.flash('Déconnexion ...');
        this.socket.disconnect();
      } else {
        this.flash(`Connexion à ${this.options.WEBSOCKET_SERVER} ...`);
        this.socket.connect(this.options.WEBSOCKET_SERVER);
      }
    });
  }

  /**
   * le click sur un bouton de contôle envoi un message au serveur
   */
  initMessageButtons() {
    $('.message').click(e => {
      e.preventDefault();
      let msg = $(e.currentTarget).data('msg');
      console.log('message clicked');
      if (this.socket.connected) {
        var obj = {};
        this.socket.emit(msg, obj);
        this.flash('msg ' + msg + ' envoyé');
        this.socket.emit('dump');
      } else {
        this.flash('non connecté');
      }
    });
  }

  /**
   * affichage d'infobulle au survol
   */
  initInfoBulle() {
    console.log('initInfoBulle');
    $('.message').hover(e => {
      let title = $(e.currentTarget).attr('title');
      $('#btn_description').html(title).fadeIn();
    }, () => {
      $('#btn_description').html('&nbsp;');
    });
  }

  /**
   * mise à jour de l'affichage des variables serveur
   *
   * @param object data
   */
  updateDumpUI(data) {
    $(this.UI.dump.screen).html(data.screen.toString());

    let social = $('<ul/>');
    data.social.forEach(item => {
      let li = $('<li/>', { 'data-key': item.key })
        .append($('<span/>', { text: item.text } ));
      social.append(li);
    });
    $(this.UI.dump.social).empty().append(social);

    let telex = $('<ol/>');
    data.telex.forEach(item => {
      let li = $('<li/>', {
        // décodage html
        text: $('<textarea/>').html(item).text()
      });
      telex.append(li);
    });
    $(this.UI.dump.telex).empty().append(telex);

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

    let edito = $('<ol/>');
    data.edito.forEach(item => {
      console.debug(item);
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
