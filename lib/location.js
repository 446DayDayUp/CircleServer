'use strict';

function degToRad(deg) {
   return deg * Math.PI / 180;
};

function radToDeg(rad) {
   return rad * 180 / Math.PI;
};

function kmToLatDeg(km) {
  return km / 110.54;
}

function kmToLngDeg(km, lat) {
  return km / (111.320 * Math.cos(degToRad(lat)));
}

// range: in meters
exports.getSquireCord = (lat, lng, range) => {
  let km = range / 1000;
  let top = lat + kmToLatDeg(km);
  let btm = lat - kmToLatDeg(km);
  let rgt = lng + kmToLngDeg(km, lat);
  let lft = lng - kmToLngDeg(km, lat);
  return {top, btm, rgt, lft}
}


exports.getCircleCords = (lat, lng, range) => {

};

