'use strict';
const path = require('path');
const { cpus } = require('os');

const config = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  reporters: ['default', 'jest-junit'],
  coverageReporters: ['html', 'cobertura'],
  maxWorkers: cpus().length * 2,
  roots: ['src', 'test'],
  coverageDirectory: 'coverage',
  globals: {
    'ts-jest': {
      suiteName: 'jest tests',
      classNameTemplate: '{classname} - {title}',
      titleTemplate: '{classname} - {title}',
      ancestorSeparator: ' > ',
      usePathForSuiteName: true,
      output: path.join(__dirname, 'TEST.xml'),
      tsconfig: path.join(__dirname, 'tsconfig.json'),
    },
  },
  collectCoverage: true,
};

module.exports = config;
