/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable jest/no-commented-out-tests */
import crypto from "crypto";
// Note that the JavaScript has to be generated already, and then we import
// from there rather than importing from the TypeScript code.
import { hexStringToNumber } from "../dist/index.js";

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
