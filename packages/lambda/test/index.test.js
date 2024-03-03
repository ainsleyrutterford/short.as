import crypto from "crypto";
import { myFunc } from "../dist/index.js";

describe("Hashing", () => {
  it("Ainsley's test", () => {
    const asd = myFunc();
    console.log("Hello, World! Console ", asd);
    assert.equal(1, 1);
  });

  it("should hash to sha256 with b64 encoding", () => {
    let hash = crypto.createHash("sha256").update("message").digest("base64");
    assert.equal(hash, "q1MKE+RZFJgrefm34/uplM/R8/si9xzqGvvwK0YMbR0=");
  });

  it("should hash to sha256 with hex encoding", () => {
    let hash = crypto.createHash("sha256").update("message").digest("hex");
    assert.equal(
      hash,
      "ab530a13e45914982b79f9b7e3fba994cfd1f3fb22f71cea1afbf02b460c6d1d"
    );
  });

  it("should hash to hmac-sha256 with b64 encoding", () => {
    let hash = crypto
      .createHmac("sha256", "key")
      .update("message")
      .digest("base64");
    assert.equal(hash, "bp7ym3X//Ft6uuUn1Y/a2y/kLnIZARl2kXNDBl9Y7Uo=");
  });

  it("should hash to hmac-sha256 with hex encoding", () => {
    let hash = crypto
      .createHmac("sha256", "key")
      .update("message")
      .digest("hex");
    assert.equal(
      hash,
      "6e9ef29b75fffc5b7abae527d58fdadb2fe42e7219011976917343065f58ed4a"
    );
  });
});

describe("random", () => {
  it("should generate a random UUID using randomUUID", () => {
    const uuid = crypto.randomUUID();
    assert.strictEqual(uuid.length, 36);
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    assert.match(uuid, uuidRegex);
  });

  it("should generate a random bytes buffer using randomBytes", () => {
    const buffer = crypto.randomBytes(16);
    assert(buffer instanceof Buffer);
    assert.strictEqual(buffer.length, 16);
  });
});
