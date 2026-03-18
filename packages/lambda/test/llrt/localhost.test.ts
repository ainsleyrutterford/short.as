import { TESTING_LOCALHOST } from "../../src/oauth/cookies";

it("TESTING_LOCALHOST should not be true when deploying the stack as part of CI/CD", () => {
  expect(TESTING_LOCALHOST).toEqual(false);
});
