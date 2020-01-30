/**
 * animation du on air
 */

'use strict';

/*globals $ */

const default_visuels_artiste = [
  '/img/default-artiste.jpg'
];

// animation "onair"

const t1 =  3000; // début anim expand titre/artiste
// -- début loop --
const t2 =  4000; // début anim fold social = début de boucle
const t3 =  5000; // début anim expand visuel
// /!\ t4 - t3 >= a3
const t4 = 21000; // début anim fold visuel
const t5 = 22000; // début expand social
// -- fin loop --
// /!\ t6 - t4 >= a4
const t6 = 38000; // début fold titre/artiste

// durée des animations css
const a1 = 1000; // expand titre/artiste
//const a2 = 2000; // fold social
//const a3 = 2000; // expand visuel
const a4 = 2000; // fold visuel
//const a5 = 2000; // expand social
const a6 = 1000; // fold titre/artiste

let timers = [];
let first = true;

module.exports = {

  /**
   * Lancement de l'animation d'affichage du titre/artiste/photo
   *
   * @param object music
   * @param bool expand visuel ?
   */
  start: function (music, do_expand_visuel) {

    // curseur global de temps
    let time = 0;

    // compteur de boucle
    let loop_idx;

    const loop_count = loopCount(music.length);
    const loop_length = loopLength();

    reset();

    // intro : début anim expand titre/artiste
    time = t1;
    timers.push(setTimeout(function () {
      $('.artist').html(music.artist);
      $('.title').html(music.title);

      // mini visuel uniquement si photo dédiée et do_expand_visuel
      if (default_visuels_artiste.indexOf(music.img) === -1 && do_expand_visuel) {
        $('.visuel').css('backgroundImage', 'url(' + music.img + ')');
      } else {
        $('.visuel').css('backgroundImage', '');
      }
      $('.visuel').css('left', $('.onair').css('width'));
      $('.onair_wrap').removeClass('folded').addClass('expanded');
    }, time));

    // intro : fin anim expand titre/artiste
    time = t1 + a1;
    timers.push(setTimeout(function () {
      $('.onair_wrap').css({
        backgroundColor: 'transparent',
        overflow: 'visible'
      });
      $('.onair').css('backgroundColor', '#ffffff');
    }, time));

    // la boucle :

    for (loop_idx = 0 ; loop_idx < loop_count ; loop_idx++)
    {
      // début anim fold social
      time = t2 + loop_idx * loop_length;
      timers.push(setTimeout(function () {
        $('.social').removeClass('expanded').addClass('folded');
      }, time));

      // apparition du visuel + début anim expand visuel
      time = t3 + loop_idx * loop_length;
      timers.push(setTimeout(function () {
        $('.onair_wrap').css({
          backgroundColor: '#ffffff',
          overflow: 'visible'
        });
        $('.onair').css('backgroundColor', '#ffffff');
        $('.visuel').css('visibility', 'visible');
        $('.visuel').removeClass('folded').addClass('expanded');
      }, time));

      // début anim fold visuel
      time = t4 + loop_idx * loop_length;
      timers.push(setTimeout(function () {
        $('.visuel').removeClass('expanded').addClass('folded');
      }, time));

      // fin anim fold visuel
      time = t4 + loop_idx * loop_length + a4;
      timers.push(setTimeout(function () {
        preOutro();
      }, time));

      // début anim expand social
      time = t5 + loop_idx * loop_length;
      timers.push(setTimeout(function () {
        $('.social').removeClass('folded').addClass('expanded');
      }, time));
    }

    // outro : début anim fold titre/artiste
    time = t6 + (loop_idx - 1) * loop_length;
    timers.push(setTimeout(function () {
      $('.onair_wrap').removeClass('expanded').addClass('folded');
    }, time));

  }

};

/**
 * Retourne la durée de la boucle
 *
 * @return int
 */
function loopLength() {
  return t6 - t2;
}

/**
 * Retourne le nombre de boucles disponibles en fonction de la durée du morceau
 *
 * @var int length longeur du morceau en ms
 * @return int nombre d'itération de la boucle
 */
function loopCount(length) {
  // durée de la boucle
  let loop = loopLength();
  // temps disponible pour l'ensemble des boucles
  let available = length - a6 - t2;

  return Math.floor(available / loop);
}

/**
 *
 */
function reset() {
  if (first) {
    first = false;
    return;
  }
  timers.forEach(function (timer) {
    clearTimeout(timer);
  });
  timers = [];

  if ($('.onair_wrap').hasClass('folded')) {
    return;
  }

  if ($('.social_wrap').hasClass('folded')) {
    $('.social_wrap').removeClass('folded').addClass('expanded');
  }

  if ($('.visuel').hasClass('expanded')) {
    $('.visuel').removeClass('expanded').addClass('folded');
    setTimeout(function () {
      preOutro();
      $('.onair_wrap').removeClass('expanded').addClass('folded');
    }, a4);
  } else {
    preOutro();
    $('.onair_wrap').removeClass('expanded').addClass('folded');
  }

}

/**
 *
 */
function preOutro() {
  $('.visuel').css('visibility', 'hidden');
  $('.onair').css('backgroundColor', 'transparent');
  $('.onair_wrap').css({
    backgroundColor: '#ffffff',
    overflow: 'hidden'
  });
}
