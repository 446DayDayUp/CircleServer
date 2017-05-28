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

exports.mBetweenCoords = (lat1, lon1, lat2, lon2) => {
  var earthRadiusInM = 6371000;

  var diffLat = degToRad(lat2 - lat1);
  var diffLon = degToRad(lon2 - lon1);

  lat1 = degToRad(lat1);
  lat2 = degToRad(lat2);

  var a = Math.sin(diffLat/2) * Math.sin(diffLat/2) +
          Math.sin(diffLon/2) * Math.sin(diffLon/2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return earthRadiusInM * c;
}