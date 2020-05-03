/**
 * animation de l‘horloge + timeline + émission
 */

'use strict';

/*globals $ */

// animation "clock" (durée totale 15s, doit être sous-multiple de 60s)

//const t0 =     0; // début du cycle
const t1 =  5000; // clock fold (durée 1s, cf. css)
const t2 =  6000; // timeline expand (durée 1s, cf. css)
const t3 =  7000; // show expand (durée 1s, cf. css)
const t4 = 12000; // show fold (durée 1s, cf. css)
const t5 = 13000; // timeline fold (durée 1s, cf. css)
const t6 = 14000; // clock expand (durée 1s, cf. css)
//const t7 = 15000; // fin du cycle

let timers = [];
let first = true;

export const animClock = {

  /**
   * Lancement de l'animation de l'alternance horloge / timeline + nom émission
   * Durée: 15sec
   */
  start: function () {

    reset();

    // t0: début du cycle

    // t1: clock fold
    timers.push(setTimeout(() => {
      $('#clock').removeClass('expanded').addClass('folded');
    }, t1));

    // t2: timeline expand
    timers.push(setTimeout(() => {
      $('#timeline').removeClass('folded').addClass('expanded');
    }, t2));

    // t3: show expand
    timers.push(setTimeout(() => {
      $('#show').removeClass('folded').addClass('expanded');
    }, t3));

    // t4: show fold
    timers.push(setTimeout(() => {
      $('#show').removeClass('expanded').addClass('folded');
    }, t4));

    // t5: timeline fold
    timers.push(setTimeout(() => {
      $('#timeline').removeClass('expanded').addClass('folded');
    }, t5));

    // t6: clock expand
    timers.push(setTimeout(() => {
      $('#clock').removeClass('folded').addClass('expanded');
    }, t6));

    // t7: fin du cycle
  }

};

/**
 * reset des timers
 */
function reset() {
  if (first) {
    first = false;
    return;
  }
  timers.forEach((timer) => {
    clearTimeout(timer);
  });
  timers = [];
  $('#show,#timeline,#clock').removeClass('expanded folded');
}
