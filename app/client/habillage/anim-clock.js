/**
 * animation de l'horloge
 */

'use strict';

/*globals $ */

// animation "clock"

const t1 =  5000; // début anim clock fold
const t2 =  6000; // début anim timeline expand
const t3 =  7000; // début anim show expand
const t4 = 12000; // début anim show fold
const t5 = 13000; // début anim timeline fold
const t6 = 14000; // début anim clock expand

// durée des animations css
//const a1 = 1000; // clock fold
//const a2 = 1000; // timeline expand
//const a3 = 1000; // show expand
//const a4 = 1000; // show fold
//const a5 = 1000; // timeline fold
//const a6 = 1000; // clock expand

let timers = [];
let first = true;

module.exports = {

  /**
   * Lancement de l'animation de l'alternance horloge / timeline + nom émission
   * Durée: 15sec
   */
  start: function () {

    reset();

    timers.push(setTimeout(function () {
      $('#clock').removeClass('expanded').addClass('folded');
    }, t1));

    timers.push(setTimeout(function () {
      $('#timeline').removeClass('folded').addClass('expanded');
    }, t2));

    timers.push(setTimeout(function () {
      $('#show').removeClass('folded').addClass('expanded');
    }, t3));

    timers.push(setTimeout(function () {
      $('#show').removeClass('expanded').addClass('folded');
    }, t4));

    timers.push(setTimeout(function () {
      $('#timeline').removeClass('expanded').addClass('folded');
    }, t5));

    timers.push(setTimeout(function () {
      $('#clock').removeClass('folded').addClass('expanded');
    }, t6));

  }

};

function reset() {
  if (first) {
    first = false;
    return;
  }
  timers.forEach(function (timer) {
    clearTimeout(timer);
  });
  timers = [];
  $('#show').removeClass('expanded').addClass('folded');
  $('#timeline').removeClass('expanded').addClass('folded');
  $('#clock').removeClass('folded').addClass('expanded');
}
