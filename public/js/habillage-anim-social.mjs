/**
 * animation du bloc titre/artiste
 */

'use strict';

/*globals $ */

let timers = [];
let first = true;

const t1 = 0;  // expand social
const t4 = 10000; // fold social

export const animSocial = {

  start: function (social) {

    reset();

    // t1: expand social
    timers.push(setTimeout(() => {
      $('.soc_avatar').attr('src', social.avatar).fadeIn(300);
      $('.soc_name').html(social.name).fadeIn(300);
      $('.soc_screen_name').html(social.screen_name).fadeIn(300);
      $('.soc_text').html(social.text).fadeIn(300);
      $('.social').removeClass('folded').addClass('expanded');
    }, t1));

    // t4: fold social
    timers.push(setTimeout(() => {
      $('.social').removeClass('expanded').addClass('folded');
    }, t4));

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

  $('.social_wrap').removeClass('expanded').addClass('folded');
}
