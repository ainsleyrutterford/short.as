import type { Config } from "jest";
import { pathsToModuleNameMapper } from "ts-jest";

const config: Config = {
  // https://kulshekhar.github.io/ts-jest/docs/getting-started/presets
  preset: "ts-jest",
  // https://jestjs.io/docs/configuration#testenvironment-string
  testEnvironment: "node",
  // https://jestjs.io/docs/configuration#testmatch-arraystring
  testMatch: ["**/test/node/**/*.test.ts", "**/test/shared/**/*.test.ts"],
  // Matches the paths in tsconfig.json
  // https://kulshekhar.github.io/ts-jest/docs/getting-started/paths-mapping
  moduleNameMapper: pathsToModuleNameMapper(
    {
      "@short-as/types": ["../types/src/index.ts"],
      "@short-as/shared": ["../shared/src/index.ts"],
    },
    { prefix: "<rootDir>/" },
  ),
};

export default config;
