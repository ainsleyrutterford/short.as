// Note that the JavaScript has to be generated already, and then we import
// from there rather than importing from the TypeScript code.
// import { encodeNumber } from "../dist/index.js";

/**
 * TODO: the tests are disabled for now since I can't get the test runner to work with
 * the newer full-sdk LLRT binaries that come with the CloudWatch client included,
 * so when we run tests we get the following error:
 *
 * ```
 *  ✘ Failed to import module, caused by:
 *  Error resolving module '@aws-sdk/client-cloudwatch' from './dist/index.js'
 * ```
 *
 * If I use the newer version (LLRT 0.3.0-beta) I get the following error:
 *
 * ```
 * ReferenceError: Error resolving module './test/encoding.test.js' from 'llrt:test/worker'
 * ```
 */

// eslint-disable-next-line jest/no-commented-out-tests
// describe("Number encoder tests", () => {
// eslint-disable-next-line jest/no-commented-out-tests
//   it("Should encode various numbers correctly", () => {
//     expect(encodeNumber(0)).toEqual("aaaaaaa");
//     expect(encodeNumber(9)).toEqual("aaaaaaj");
//     expect(encodeNumber(51)).toEqual("aaaaaaZ");
//     expect(encodeNumber(52)).toEqual("aaaaaba");
//     expect(encodeNumber(2703)).toEqual("aaaaaZZ");
//     expect(encodeNumber(2704)).toEqual("aaaabaa");
//     expect(encodeNumber(8367293458)).toEqual("awatXnE");
//     expect(encodeNumber(19770609663)).toEqual("aZZZZZZ");
//     expect(encodeNumber(78367293458)).toEqual("dYgjVlM");
//     expect(encodeNumber(1028071702526)).toEqual("ZZZZZZY");
//     expect(encodeNumber(1028071702527)).toEqual("ZZZZZZZ");
//   });
// });
