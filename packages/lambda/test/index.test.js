import crypto from "crypto";
// Note that the JavaScript has to be generated already, and then we import
// from there rather than importing from the TypeScript code.
import { handler, hexStringToNumber } from "../dist/index.js";

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

// describe("random", () => {
//   it("should generate a random UUID using randomUUID", () => {
//     const uuid = crypto.randomUUID();
//     assert.strictEqual(uuid.length, 36);
//     const uuidRegex =
//       /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
//     assert.match(uuid, uuidRegex);
//   });

//   it("should generate a random bytes buffer using randomBytes", () => {
//     const buffer = crypto.randomBytes(16);
//     assert(buffer instanceof Buffer);
//     assert.strictEqual(buffer.length, 16);
//   });
// });
