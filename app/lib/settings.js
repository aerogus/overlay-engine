/**
 * chargement des paramètres de l'app
 */

'use strict';

const settingsFile = __dirname + '/../../settings.json';
const fs = require('fs');
const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));

module.exports = settings;
