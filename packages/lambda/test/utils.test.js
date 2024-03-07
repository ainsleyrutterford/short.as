// Note that the JavaScript has to be generated already, and then we import
// from there rather than importing from the TypeScript code.
import { encodeNumber, hexStringToNumber } from "../dist/index.js";

describe("Number encoder tests", () => {
  it("Should encode various numbers correctly", () => {
    assert.equal(encodeNumber(0), "aaaaaaa");
    assert.equal(encodeNumber(9), "aaaaaaj");
    assert.equal(encodeNumber(51), "aaaaaaZ");
    assert.equal(encodeNumber(52), "aaaaaba");
    assert.equal(encodeNumber(2703), "aaaaaZZ");
    assert.equal(encodeNumber(2704), "aaaabaa");
    assert.equal(encodeNumber(8367293458), "awatXnE");
    assert.equal(encodeNumber(19770609663), "aZZZZZZ");
    assert.equal(encodeNumber(78367293458), "dYgjVlM");
    assert.equal(encodeNumber(1028071702526), "ZZZZZZY");
    assert.equal(encodeNumber(1028071702527), "ZZZZZZZ");
  });
});

describe("Hex string to number", () => {
  it("Should convert various hex strings correctly", () => {
    // lowercase
    assert.equal(hexStringToNumber('1a'), 26);
    assert.equal(hexStringToNumber('ff'), 255);
    assert.equal(hexStringToNumber('2e'), 46);
    assert.equal(hexStringToNumber('ffff'), 65535);
    // uppercase
    assert.equal(hexStringToNumber('2B'), 43);
    assert.equal(hexStringToNumber('FE'), 254);
    assert.equal(hexStringToNumber('A7'), 167);
    // zero
    assert.equal(hexStringToNumber('0'), 0);
    assert.equal(hexStringToNumber('00'), 0);
  });

  // https://github.com/awslabs/llrt/issues/240
  // it("Should return NaN when an invalid hex string is provided", () => {
  //   assert.equal(hexStringToNumber('xyz'), NaN);
  //   assert.equal(hexStringToNumber('0xg'), NaN);
  //   assert.equal(hexStringToNumber('0Xh'), NaN);
  // });
});
