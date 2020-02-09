/**
 * animation du bloc titre/artiste
 */

'use strict';

/*globals $ */

let timers = [];
let first = true;

const t1 = 2000; // expand titre/artiste
const t2 = 8000; // fold titre/artiste

module.exports = {

  start: function (music) {

    reset();

    // t1: expand titre/artiste
    timers.push(setTimeout(() => {
      $('.artist').html(music.artist);
      $('.title').html(music.title);
      $('.onair_wrap').removeClass('folded').addClass('expanded');
    }, t1));

    // t2: fold titre/artiste
    timers.push(setTimeout(() => {
      $('.onair_wrap').removeClass('expanded').addClass('folded');
    }, t2));

  }

};

function reset() {
  if (first) {
    first = false;
    return;
  }
  timers.forEach((timer) => {
    clearTimeout(timer);
  });
  timers = [];

  $('.onair_wrap').removeClass('expanded').addClass('folded');
}
