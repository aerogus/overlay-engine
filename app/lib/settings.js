/**
 * chargement des paramètres de l'app
 */

/* globals module, require, __dirname */

'use strict';

const settingsFile = `${__dirname}/../../conf/settings.json`;
const fs = require('fs');
const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));

module.exports = settings;
