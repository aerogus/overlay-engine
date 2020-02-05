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
        always: '#var_always',
        screen: '#var_screen',
        mic: '#var_mic',
        pub: '#var_pub',
        social: '#var_social',
        news: '#var_news',
        show: '#var_show',
        music: '#var_music',
        ads: '#var_ads'
      }
    };

    this.initConnectButtons();
    this.initMessageButtons();
    this.initInfoBulle();
    this.initModeration();

    this.socket = io(this.options.WEBSOCKET_SERVER);
    this.socket.emit('dump');

    this.socket.on('connect', () => {
      console.log('[OK] connected to ' + this.options.WEBSOCKET_SERVER);
      $('#conx').removeClass('disconnected').addClass('connected');
      $('#conx').html('Se déconnecter');
      this.flash('Connecté à ' + this.options.WEBSOCKET_SERVER);
    });

    this.socket.on('connect_error', () => {
      console.log('[KO] ' + this.options.WEBSOCKET_SERVER + ' not launched');
    });

    this.socket.on('disconnect', () => {
      console.log('[OK] disconnected from ' + this.options.WEBSOCKET_SERVER);
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
      'ZIK', 'AON', 'AOF',
      'PON', 'POF', 'MON', 'MOF', 'ZON', 'ZOF',
      'EMI', 'ADS', 'NWS', 'SOC', 'SOCDEL'
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
        this.flash('Connexion à ' + this.options.WEBSOCKET_SERVER + ' ...');
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
        var obj;
        switch (msg) {

          case 'ZIK':
            obj = { // objet music
              artist: 'BLP Radio',
              title: 'La Webradio du Nord Essonne',
              img: '/img/default-artiste.jpg'
            };
            break;

          case 'EMI':
            obj = { // objet show
              title: 'Rock non Stop',
              color: '#f7303c',
              hashtag: 'ouifm',
              horaire: '0H-24H'
            };
            break;

          case 'ADS':
            obj = {
              ads: [{
                img: 'http://www.ouifm.fr/wp-content/uploads/sliders/1891.jpg'
              }, {
                img: 'http://www.ouifm.fr/wp-content/uploads/sliders/1897.jpg'
              }, {
                img: 'http://www.ouifm.fr/wp-content/uploads/sliders/1880.jpg'
              }]
            };
            break;

          case 'SOC':
            obj = { // objet message social
              avatar: 'http://pbs.twimg.com/profile_images/760504224811741184/9cWo1RA7.jpg',
              name: 'Arnold @Arnold_Officiel',
              network: 'twitter',
              message: '@ouifm bonjour, j\'entends comme des petits coups sourds sur le micro dès que l\'animatrice s\'exprime. Comme si un nez heurtait la bonnette'
            };
            break;

          case 'NWS':
            obj = { // objet news
              title: 'Le Download Festival Paris révèle ses premiers noms'
            };
            break;

          default:
            // objet vide pour les autres types de messages
            obj = {};
            break;

        }

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

  initModeration() {
    console.log('initModeration');
    $('#var_social').on('click', 'button.delete', e => {
      let message = $(e.currentTarget).parent().find('span').text();
      if (confirm('Confirmez-vous la suppression du message suivant ?\n\n' + message)) {
        let key = $(e.currentTarget).parent().data('key');
        if (this.socket.connected) {
          let msg = 'SOCDEL';
          this.socket.emit(msg, key);
          this.flash('msg ' + msg + ' envoyé');
          this.socket.emit('dump');
        } else {
          this.flash('non connecté');
        }
      }
    });
  }

  /**
   * mise à jour de l'affichage des variables serveur
   *
   * @param object data
   */
  updateDumpUI(data) {
    $(this.UI.dump.always).html(data.always.toString());
    $(this.UI.dump.screen).html(data.screen.toString());
    $(this.UI.dump.mic).html(data.mic.toString());
    $(this.UI.dump.pub).html(data.pub.toString());

    let social = $('<ul/>');
    data.social.forEach(item => {
      let li = $('<li/>', { 'data-key': item.key })
        .append($('<button/>', { class: 'delete' }))
        .append($('<span/>', { text: item.message } ));
      social.append(li);
    });
    $(this.UI.dump.social).empty().append(social);

    let news = $('<ol/>');
    data.news.forEach(item => {
      let li = $('<li/>', {
        // décodage html
        text: $('<textarea/>').html(item.title).text()
      });
      news.append(li);
    });
    $(this.UI.dump.news).empty().append(news);

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

    let ads = $('<ol/>');
    data.ads.forEach(item => {
      console.debug(item);
      let li = $('<li/>', {
        text: item.img
      });
      ads.append(li);
    });
    $(this.UI.dump.ads).empty().append(ads);

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
