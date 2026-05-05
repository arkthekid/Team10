const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  transformIgnorePatterns: [
    "node_modules/(?!(uuid)/)"
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    ".*\\.api\\.test\\.ts$",
  ],
};