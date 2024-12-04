/**
 * gestion de la grille des programmes
 */

/* globals module, require, __dirname */

'use strict';

const fs = require('fs')
  , moment = require('moment');

const gridFile = `${__dirname}/../../conf/grid.json`;

/**
 * Lit le fichier json de la grille
 * converti les données temporelles relatives en millitimestamps absolus
 * créé des objets "show"
 *
 * @param {string} gridFile 
 * @return object
 */
function readGridFile(gridFile) {
  let obj = {};
  let absDayMTS = moment().startOf('isoWeek').unix() * 1000;
  let json = JSON.parse(fs.readFileSync(gridFile, 'utf8'));
  for (let [dayName, shows] of Object.entries(json)) { // boucle des jours de la semaine
    obj[dayName] = {};
    for (let [showTimes, showTitle] of Object.entries(shows)) { // boucles des émissions d'un jour
      let [startTime, endTime] = showTimes.split('-');
      obj[dayName][startTime] = {
        title: showTitle,
        color: '#000',
        color_alt: '#ffffff',
        start: absDayMTS + (startTime.substr(0, 2) * 3600 + startTime.substr(2, 2) * 60) * 1000,
        end: absDayMTS + (endTime.substr(0, 2) * 3600 + endTime.substr(2, 2) * 60) * 1000,
      };
    }
    absDayMTS += 60 * 60 * 24 * 1000;
  }
  return obj;
}
  
module.exports = {

  /**
   * une nouvelle émission démarre-t-elle à la minute courante ?
   * si oui retourne l'objet show, sinon false
   *
   * @return object|false
   */
  isNew: () => {
    const grid = readGridFile(gridFile);
    const dayName = moment().format('dddd').toLowerCase();
    const currentHHMM = moment().format('hhmm');
    return grid[dayName].hasOwnProperty(currentHHMM);
  },

  /**
   * retourn les infos sur l'émission en cours
   *
   * @return object
   */
  getCurrent: () => {
    const grid = readGridFile(gridFile);
    const dayName = moment().format('dddd').toLowerCase();
    const currentMTS = moment().unix() * 1000;
    for (let show of Object.values(grid[dayName])) {
      if ((currentMTS >= show.start) && (currentMTS < show.end)) {
        return show;
      }
    }
    return false;
  }

};