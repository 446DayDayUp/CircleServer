'use strict'
let {getSquireCord, mBetweenCoords} = require('../lib/location.js');
describe("getSquireCord", function() {
  it("correct when input range is 0", function() {
    let {top, btm, rgt, lft} = getSquireCord(43.47967, -80.52422, 0);
    expect(top).toBeCloseTo(43.47967);
    expect(btm).toBeCloseTo(43.47967);
    expect(rgt).toBeCloseTo(-80.52422);
    expect(lft).toBeCloseTo(-80.52422);
  });
});

describe('mBetweenCoords', function() {
  it('return 0 if two cords are the same', function() {
    expect(mBetweenCoords(0,0,0,0)).toEqual(0);
    expect(mBetweenCoords(55,-83,55,-83)).toEqual(0);
  })
  it('calcualtes correct result', function() {
    var pi = 3.1415926,
      e = 2.78;
    expect(mBetweenCoords(51.5, 0, 38.8, -77.1)).toBeCloseTo(5918185.064);
  })
})