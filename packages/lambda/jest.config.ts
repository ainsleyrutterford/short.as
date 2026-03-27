import type { Config } from "jest";
import { pathsToModuleNameMapper } from "ts-jest";
import { compilerOptions } from "./tsconfig.json";

const config: Config = {
  // https://kulshekhar.github.io/ts-jest/docs/getting-started/presets
  preset: "ts-jest",
  // https://jestjs.io/docs/configuration#testenvironment-string
  testEnvironment: "node",
  // https://jestjs.io/docs/configuration#testmatch-arraystring
  testMatch: ["**/test/node/**/*.test.ts", "**/test/shared/**/*.test.ts"],
  // https://kulshekhar.github.io/ts-jest/docs/getting-started/paths-mapping
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>/" }),
};

export default config;
