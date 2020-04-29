/**
 * stockage des données de l'app
 *
 * persistence non gérée: l'arrêt de l'app vide la mémoire
 */

'use strict';

// taille de l'écran de destination
const WIDTH = 1920;
const HEIGHT = 1080;

// identifiants des types de réactions
const types = [
  'angry',
  'haha',
  'like',
  'love',
  'sad',
  'wow'
];

// tableau d'objets réactions [ts, type, coords.x, coords.y]
let reactions = [];

/**
 * @return array
 */
function getTypes () {
  return types;
}

/**
 * @return array
 */
function getReactions () {
  return reactions;
}

/**
 * Ajoute une nouvelle réaction
 *
 * @return false ou object
 */
function addReaction (type) {

  // check que la réaction est gérée par l'app
  if (types.indexOf(type) == -1) {
    return false;
  }

  let reaction = {};
  reaction.ts = Date.now();
  reaction.type = type;
  reaction.coords = getRandomCoords();
  reactions.push(reaction);

  return reaction;
}

/**
 * retourne des coordonées aléatoire sur l'écran de destination
 * @return object
 */
function getRandomCoords () {
  let x = Math.floor(Math.random() * WIDTH);
  let y = Math.floor(Math.random() * HEIGHT);

  return {
    x,
    y
  };
}

module.exports = {
  getTypes,
  getReactions,
  addReaction
};
