/**
 * chargement des paramètres
 */

'use strict';

const settingsFile = __dirname + '/config/overlay-engine.json';
const fs = require('fs');
const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));

module.exports = settings;
