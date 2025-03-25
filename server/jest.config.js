'use strict';
const path = require('path');
const { cpus } = require('os');

const config = {
  testEnvironment: 'node',
  reporters: ['default', 'jest-junit'],
  coverageReporters: ['html', 'cobertura'],
  maxWorkers: cpus().length,
  roots: ['src', 'test'],
  coverageDirectory: 'coverage',
  collectCoverage: true,
  transform: {
    '^.+.tsx?$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.json',
        suiteName: 'jest tests',
        classNameTemplate: '{classname} - {title}',
        titleTemplate: '{classname} - {title}',
        ancestorSeparator: ' > ',
        usePathForSuiteName: true,
        output: './TEST.xml',
      },
    ],
  },
};

module.exports = config;
