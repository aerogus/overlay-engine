/**
 * Module de gestion de log horodaté
 */

/* globals console, module, require */

'use strict';

let util = require('util')
  , moment = require('moment');

/**
 * préfixe la log par un horodatage
 *
 * @param string msg
 */
module.exports = function (msg) {
  console.log('[' + moment().format('YYYY-MM-DD HH:mm:ss') + '] ' + util.inspect(msg));
};
