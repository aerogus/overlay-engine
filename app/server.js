#!/usr/bin/env node

/**
 * Serveur temps réel du moteur d'habillage
 * reçoit et broadcast des messages websocket
 */

'use strict';

const express = require('express')
  , app = express()
  , path = require('path')
  , server = require('http').Server(app)
  , io = require('socket.io')(server)
  , sqlite3 = require('sqlite3').verbose();

const settings = require('./lib/settings')
  , log = require('./lib/log')
  , data = require('./lib/data')
  , dbFile = path.join(__dirname, '/../db/overlay-engine.db');

// connexion à la DB, la créée si inexistante
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error(err.message);
  }
  //db.run(`SQL QUERIES`);
  console.log('Connecté');
});

// connexion d'un client
io.on('connection', socket => {

  log('client connected');

  // demande le contenu de la mémoire
  socket.on('DMP', () => {
    log('DMP received');
    socket.emit('DMP', data.dump());
    log('DMP emitted');
  });

  // réception d'une impulsion de début de chanson + metainfo
  socket.on('ZIK', music => {
    log('ZIK received with object');
    log(music);
    data.music = music;
    io.emit('ZIK', music);
    log('ZIK broadcasted with object');
  });

  // réception des infos sur l'émission courante
  socket.on('EMI', show => {
    log('EMI received with object:');
    log(show);
    data.show = show;
    io.emit('EMI', show);
    log('EMI broadcasted with object');
  });

  // réception d'une impulsion de demande de refresh de l'habillage
  socket.on('UPD', () => {
    log('UPD received');
    io.emit('UPD');
    log('UPD broadcasted');
  });

  // réception d'un nouveau telex
  // broadcast de l'ensemble des telex
  socket.on('TLX', telex => {
    log('TLX received width object');
    log(telex);
    data.addTelex(telex); // fait le check max
    io.emit('TLX', data.telex);
    log('TLX broadcasted');
  });

  // suppression d'un telex identifié
  // broadcast de l'ensemble des telex
  socket.on('TLX_DEL', (id) => {
    log(`TLX_DEL ${id}`);
    data.delTelex(id);
    io.emit('TLX', data.telex);
    log('TLX broadcasted');
  });

  // réception d'un nouveau message de twitter + metainfo
  socket.on('TWI', social => {
    log('TWI received with object');
    log(social);
    data.addSocial(social);
    io.emit('SOC', social);
    log('SOC broadcasted');
  });

  // réception d'un nouveau commentaire d'un FB Live + metainfo
  socket.on('FBL_COM', social => {
    log('FBL_COM received with object');
    log(social);
    data.addSocial(social);
    io.emit('SOC', social);
    log('SOC broadcasted');
  });

  // réception d'une nouvelle réaction d'un Facebook Live + metainfo
  socket.on('FBL_REA', reaction => {
    log('FBL_REA received with object');
    log(reaction);
    io.emit('SOC_REA', reaction);
    log('SOC_REA broadcasted');
  });

  // réception d'une demande de retrait d'un message social
  socket.on('SOC_DEL', key => {
    log('SOC_DEL received with object');
    log(key);
    data.delSocial(key);
    io.emit('SOC_DEL', key);
    log('SOC_DEL broadcasted');
  });

  // envoi à l'habillage du message social modéré
  socket.on('SOC_AIR', social => {
    log('SOC_AIR received with object');
    log(social);
    data.tweet = social;
    io.emit('SOC_AIR', social);
  });

  // réception de la liste des photos à diffuser
  socket.on('EDI', edi => {
    log('EDI received with object');
    log(edi);
    data.edi = edi;
    io.emit('EDI', data.edi);
    log('EDI broadcasted');
  });

  // réception LOGO
  socket.on('LOGO', display => {
    log('LOGO received with object');
    log(display);
    data.logo = display;
    io.emit('LOGO', data.logo);
    log('LOGO broadcasted');
  });

  // réception CLOCK
  socket.on('CLOCK', display => {
    log('CLOCK received with object');
    log(display);
    data.clock = display;
    io.emit('CLOCK', data.clock);
    log('CLOCK broadcasted');
  });

  // réception TELEX
  socket.on('TELEX', display => {
    log('TELEX received with object');
    log(display);
    data.footer = display;
    io.emit('TELEX', data.footer);
    log('TELEX broadcasted');
  });

  // déconnexion du client
  socket.on('disconnect', () => {
    log('client disconnected');
  });

});

// démarrage serveur
log(`${settings.server.HOST} server starting...`);

// chargement initial des données
data.load();

server.listen(settings.server.PORT, () => {
  log(`listening to port ${settings.server.PORT}`);
});

app.disable('x-powered-by');

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');

// route habillage
app.get(/^\/$/, (req, res) => {
  res.render('habillage', {
    ws_host: settings.server.HOST,
    ws_port: settings.server.PORT
  });
});

// route console d'admin
app.get(/^\/admin$/, (req, res) => {
  res.render('admin', {
    ws_host: settings.server.HOST,
    ws_port: settings.server.PORT
  });
});

app.use(express.static(`${__dirname}/../public`), (req, res, next) => {
  // cache bust
  req.url = req.url.replace(/\/([^\/]+)\.[0-9]+\.(min\.)?(css|js)$/, '/$1.$2$3');
  next();
});
app.use(express.static(`${__dirname}/../public`));

// écoute le signal TERM (ex: kill)
process.on('SIGTERM', () => {
  log(`SIGTERM: shutting down ${settings.server.HOST} server...`);
  process.exit();
});

// écoute le signal INT (ex: Ctrl-C)
process.on('SIGINT', () => {
  log(`SIGINT: shutting down ${settings.server.HOST} server...`);
  process.exit();
});
