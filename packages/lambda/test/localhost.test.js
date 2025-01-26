// Note that the JavaScript has to be generated already, and then we import
// from there rather than importing from the TypeScript code.
import { TESTING_LOCALHOST } from "../dist/index.js";

it("TESTING_LOCALHOST should not be true when deploying the stack as part of CI/CD", () => {
  expect(TESTING_LOCALHOST).toEqual(false);
});
