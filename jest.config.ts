import type { Config } from "@jest/types"

const config: Config.InitialOptions = {
  testEnvironment: "jsdom",
  preset: "ts-jest",
  rootDir: "./tests",
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    "^@/lib(.*)$": "<rootDir>/lib$1",
    "^@/hooks(.*)$": "<rootDir>/hooks$1",
    "^@/components(.*)$": "<rootDir>/components$1"
  }
}

export default config
