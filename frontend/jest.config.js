const { createCjsPreset } = require('jest-preset-angular/presets');

const presetConfig = createCjsPreset();

/** @type {import('jest').Config} */
module.exports = {
  ...presetConfig,
  setupFiles: ['<rootDir>/setup-jest.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  testMatch: ['<rootDir>/src/tests-unitaria/**/*.spec.ts'],
  testMatch: ['<rootDir>/src/tests-integracion/**/*.spec.ts'],
};
