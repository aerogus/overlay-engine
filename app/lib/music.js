'use strict';

const request = require('request');

const songUrl = 'http://www.blpradio.fr/sam/livetitle.php';

// parser du livetitle.php
const regexp = /<h5>([^>]*)<\/h5><h6>([^>]*)<H6><\/p><div class="meter red animate"><span style="width: ([^>]+)"><\/span><\/div>/;

// attention, format:
const regexpFlash = /<strong>([^>]+)<\/strong>/;
// <div id="liveEmission"><strong>Flash Infos (RFI)</strong></div>

const song = { // objet chanson
  'artist': '',
  'title': '',
  'img': 'img/music/default.jpg',
  'length': 60000 // en ms. mini 60000 (durée animation)
};

module.exports = {

  getCurrent: () => {
    return new Promise((resolve, reject) => {
      request(songUrl, (err, res, body) => {
        if (err) return reject(err);
        let extract = body.match(regexp);
        if (extract === null) {
          let extractFlash = body.match(regexpFlash);
          if (extractFlash === null) {
            return reject('livetitle non parsable');
          } else {
            song.artist = extractFlash[1];
            song.title = 'BLP Radio';
            resolve(song);
          }
        } else {
          song.artist = extract[1];
          song.title = extract[2];
          resolve(song);
        }
      });
    });
  }
}
