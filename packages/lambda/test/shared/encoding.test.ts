import { encodeNumber } from "../../src/encoding";
import { captureConsole } from "./test-utils";

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

  it("Should warn for numbers exceeding max representable value", async () => {
    const warnings = await captureConsole("warn", () => {
      encodeNumber(1028071702528);
    });
    expect(warnings.length).toBe(1);
  });
});
