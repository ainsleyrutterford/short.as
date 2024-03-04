import crypto from "crypto";
// Note that the JavaScript has to be generated already, and then we import
// from there rather than importing from the TypeScript code.
import { handler, encodeNumber } from "../dist/index.js";

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
