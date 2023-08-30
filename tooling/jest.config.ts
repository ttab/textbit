import type { Config } from "@jest/types"

const config: Config.InitialOptions = {
    testEnvironment: "jsdom",
    preset: "ts-jest",
    rootDir: "../src",
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
        '@fontsource': 'identity-obj-proxy'
    }
}

export default config