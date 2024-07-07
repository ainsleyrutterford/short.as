// Note that the JavaScript has to be generated already, and then we import
// from there rather than importing from the TypeScript code.
import { encodeNumber, hexStringToNumber } from "../dist/index.js";

describe("Number encoder tests", () => {
  it("Should encode various numbers correctly", () => {
    expect(encodeNumber(0)).toEqual("aaaaaaa");
    expect(encodeNumber(9)).toEqual("aaaaaaj");
    expect(encodeNumber(51)).toEqual("aaaaaaZ");
    expect(encodeNumber(52)).toEqual("aaaaaba");
    expect(encodeNumber(2703)).toEqual("aaaaaZZ");
    expect(encodeNumber(2704)).toEqual("aaaabaa");
    expect(encodeNumber(8367293458)).toEqual("awatXnE");
    expect(encodeNumber(19770609663)).toEqual("aZZZZZZ");
    expect(encodeNumber(78367293458)).toEqual("dYgjVlM");
    expect(encodeNumber(1028071702526)).toEqual("ZZZZZZY");
    expect(encodeNumber(1028071702527)).toEqual("ZZZZZZZ");
  });
});

describe("Hex string to number", () => {
  it("Should convert various hex strings correctly", () => {
    // lowercase
    expect(hexStringToNumber("1a")).toEqual(26);
    expect(hexStringToNumber("ff")).toEqual(255);
    expect(hexStringToNumber("2e")).toEqual(46);
    expect(hexStringToNumber("ffff")).toEqual(65535);
    // uppercase
    expect(hexStringToNumber("2B")).toEqual(43);
    expect(hexStringToNumber("FE")).toEqual(254);
    expect(hexStringToNumber("A7")).toEqual(167);
    // zero
    expect(hexStringToNumber("0")).toEqual(0);
    expect(hexStringToNumber("00")).toEqual(0);
  });

  it("Should return NaN when an invalid hex string is provided", () => {
    expect(hexStringToNumber("xyz")).toEqual(NaN);
    expect(hexStringToNumber("0xg")).toEqual(NaN);
    expect(hexStringToNumber("0Xh")).toEqual(NaN);
  });
});
