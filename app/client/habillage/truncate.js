/**
 * fonction truncate
 */

'use strict';

module.exports = function (str, length, end) {
  if ((length == null) || (length >= str)) {
    return str;
  }
  if (end == null) {
    end = '…';
  }
  if (length >= str.length) {
    end = '';
  }
  return str.slice(0, Math.max(0, length - end.length)) + end;
};
