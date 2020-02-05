#!/usr/bin/env node

/**
 * Serveur temps réel du moteur d'habillage
 * reçoit/émet des messages websocket
 *
 * émet les messages à destination de clients
 * (habillage et admin)
 *
 * Serveur node.js websocket
 *
 * On utilise forever pour la gestion du daemon
 * todo: systemd sous Debian. faire le fichier unit
 */

'use strict';

let fs = require('fs')
  , path = require('path')
  , http = require('http')
  , express = require('express')
  , morgan = require('morgan')
  , FileStreamRotator = require('file-stream-rotator');

let settings = require('./lib/settings')
  , log = require('./lib/log')
  , data = require('./lib/data');

let app = express();
let server = http.Server(app);
let io = require('socket.io')(server);

// gestion access log avec granularité
let logDirectory = path.join(__dirname, '../log');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
app.use(morgan('combined', {
  stream: FileStreamRotator.getStream({
    date_format: 'YYYYMMDD',
    filename: path.join(logDirectory, 'access-%DATE%.log'),
    frequency: 'daily',
    verbose: false
  })
}));
// gestion access log avec granularité

log('NODE_ENV = ' + process.env.NODE_ENV);

// connexion d'un client
io.on('connection', socket => {

  log('client connected');

  // demande le contenu de la mémoire
  socket.on('dump', () => {
    log('dump received');

    socket.emit('dumped', data.dump());
    log('dumped emitted');
  });

  /* MESSAGES DE L'ARDUINO OU admin.php */

  // réception d'une impulsion d'ouverture du micro
  socket.on('AON', () => {
    log('AON received');

    data.mic = true;

    io.emit('AON');
    log('AON broadcasted');

    if (data.computeScreen()) {
      io.emit('screen', data.screen);
      log('screen ' + data.screen + ' broadcasted');
    }
  });

  // réception d'une impulsion de fermeture du micro
  socket.on('AOF', () => {
    log('AOF received');

    data.mic = false;

    io.emit('AOF');
    log('AOF broadcasted');

    if (data.computeScreen()) {
      io.emit('screen', data.screen);
      log('screen ' + data.screen + ' broadcasted');
    }
  });

  // réception d'une impulsion de début d'écran pub
  socket.on('PON', () => {
    log('PON received');

    data.pub = true;
    data.music = data.music_pon;

    io.emit('PON');
    log('PON broadcasted');
    io.emit('ZIK', data.music);
    log('ZIK broadcasted with object');

    if (data.computeScreen()) {
      io.emit('screen', data.screen);
      log('screen ' + data.screen + ' broadcasted');
    }
  });

  // réception d'une impulsion de fin d'écran pub
  socket.on('POF', () => {
    log('POF received');

    data.pub = false;
    data.music = data.music_pof;

    io.emit('POF');
    log('POF broadcasted');

    // ZIK est souvent envoyé AVANT POF donc évitons de l'écraser
    //io.emit('ZIK', data.music);
    //log('ZIK broadcasted with object');

    if (data.computeScreen()) {
      io.emit('screen', data.screen);
      log('screen ' + data.screen + ' broadcasted');
    }
  });

  /* MESSAGES DE update-title.php OU /admin */

  // réception d'une impulsion de début de chanson + metainfo
  socket.on('ZIK', music => {
    log('ZIK received with object');
    log(music);

    data.music = music;

    io.emit('ZIK', music);
    log('ZIK broadcasted with object');
  });

  /* MESSAGES DE /admin */

  // réception d'une impulsion de demande de refresh de l'habillage
  socket.on('UPD', () => {
    log('UPD received');
    io.emit('UPD');
    log('UPD broadcasted');
  });

  // réception d'une impulsion d'activation du mode maintenance
  socket.on('MON', () => {
    log('MON received');

    data.maintenance = true;

    io.emit('MON');
    log('MON broadcasted');

    if (data.computeScreen()) {
      io.emit('screen', data.screen);
      log('screen ' + data.screen + ' broadcasted');
    }
  });

  // réception d'une impulsion de désactivation du mode maintenance
  socket.on('MOF', () => {
    log('MOF received');
    data.maintenance = false;

    io.emit('MOF');
    log('MOF broadcasted');

    if (data.computeScreen()) {
      io.emit('screen', data.screen);
      log('screen ' + data.screen + ' broadcasted');
    }
  });

  // réception d'une impulsion d'activation du mode always on
  socket.on('ZON', () => {
    log('ZON received');

    data.always = true;

    io.emit('ZON');
    log('ZON broadcasted');

    if (data.computeScreen()) {
      io.emit('screen', data.screen);
      log('screen ' + data.screen + ' broadcasted');
    }
  });

  // réception d'une impulsion de désactivation du mode always on
  socket.on('ZOF', () => {
    log('ZOF received');

    data.always = false;

    io.emit('ZOF');
    log('ZOF broadcasted');

    if (data.computeScreen()) {
      io.emit('screen', data.screen);
      log('screen ' + data.screen + ' broadcasted');
    }
  });

  /* divers */

  // réception d'une nouvelle news + metainfo
  socket.on('NWS', news => {
    log('NWS received width object');
    log(news);

    data.addNews(news);

    io.emit('NWS', news);
    log('NWS broadcasted');
  });

  // réception d'un nouveau message social + metainfo
  socket.on('SOC', social => {
    log('SOC received with object');
    log(social);

    data.addSocial(social);

    io.emit('SOC', social);
    log('SOC broadcasted');
  });

  // réception d'une demande de retrait d'un message social
  socket.on('SOCDEL', key => {
    log('SOCDEL received with object');
    log(key);

    data.delSocial(key);

    io.emit('SOCDEL', key);
    log('SOCDEL broadcasted');
  });

  // réception d'une impulsion de début d'émission + metainfo
  socket.on('EMI', show => {
    log('EMI received with object:');
    log(show);

    data.show = show;

    io.emit('EMI', show);
    log('EMI broadcasted with object');
  });

  // réception des sliders à diffuser
  socket.on('ADS', ads => {
    log('ADS received with object');
    log(ads.ads);

    data.ads = ads.ads;

    io.emit('ADS', data.ads);
    log('ADS broadcasted');
  });

  // déconnexion du client
  socket.on('disconnect', () => {
    log('client disconnected');
  });

});

// démarrage serveur
log(settings.server.HOST + ' server starting ...');

// chargement initial des données
data.load();

server.listen(settings.server.PORT, () => {
  log('listening to port ' + settings.server.PORT);
});

app.disable('x-powered-by');

app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

// Pour letsencrypt
//app.use('/.well-known', express.static(__dirname + '/../public/.well-known'));

// habillage
app.get(/^\/$/, (req, res) => {
  res.render('habillage', {
    ws_host: settings.server.HOST,
    ws_port: settings.server.PORT
  });
});

// console d'admin
app.get(/^\/admin$/, (req, res) => {
  res.render('admin', {
    ws_host: settings.server.HOST,
    ws_port: settings.server.PORT
  });
});

// console d'admin
app.get(/^\/wall$/, (req, res) => {
  res.render('wall', {
    ws_host: settings.server.HOST,
    ws_port: settings.server.PORT
  });
});

// passerelle push utilisée par l'arduino qui ne communique pas directement en websocket
app.get(/^\/push$/, (req, res) => {
  let event = req.query.e;
  let socket = require('socket.io-client')('ws://' + settings.server.HOST + ':' + settings.server.PORT);
  socket.on('connect', () => {
    socket.emit(event);
    socket.disconnect();
  });

  res.setHeader('Content-Type', 'text/html');
  res.send(`push ${event}`);
});

app.use(express.static(__dirname + '/../public'), (req, res, next) => {
  // cache bust
  req.url = req.url.replace(/\/([^\/]+)\.[0-9]+\.(min\.)?(css|js)$/, '/$1.$2$3');
  next();
});
app.use(express.static(__dirname + '/../public'));

// écoute le signal TERM (ex: kill)
process.on('SIGTERM', () => {
  log('SIGTERM : shutting down ' + settings.server.HOST + ' server ...');
  process.exit();
});

// écoute le signal INT (ex: Ctrl-C)
process.on('SIGINT', () => {
  log('SIGINT : shutting down ' + settings.server.HOST + ' server ...');
  process.exit();
});
