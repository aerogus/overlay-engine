/**
 * Parsing du titre en cours pour BLP Radio
 */

'use strict';

const axios = require('axios');

const songUrl = 'http://www.blpradio.fr/sam/livetitle.php';

// parser du livetitle.php
const regexp = /<h5>([^>]*)<\/h5><h6>([^>]*)<H6><\/p><div class="meter red animate"><span style="width: ([^>]+)"><\/span><\/div>/;

// attention, format:
const regexpFlash = /<strong>([^>]+)<\/strong>/;
// <div id="liveEmission"><strong>Flash Infos (RFI)</strong></div>

module.exports = {

  getCurrent: () => {
    return new Promise((resolve, reject) => {

      axios(songUrl)
        .then(response => {
          let extract = response.data.match(regexp);
          if (extract === null) {
            let extractFlash = response.data.match(regexpFlash);
            if (extractFlash === null) {
              return reject('livetitle non parsable');
            } else {
              const song = {
                artist: extractFlash[1],
                title: 'BLP Radio',
                from: 'autosong',
              };
              resolve(song);
            }
          } else {
            const song = {
              artist: extract[1],
              title: extract[2]
            };
            resolve(song);
          }
        })
        .catch(error => {
          return reject(error);
        });

    });
  }
};
