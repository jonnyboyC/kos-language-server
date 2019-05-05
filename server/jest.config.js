const path = require('path');

const config = {
  preset: 'ts-jest',
  reporters: [
    "default",
    "jest-junit"
  ],
  coverageReporters: [
    "html",
    "cobertura",
  ],
  rootDir: "src",
  globals: {
    'ts-jest': {
      suiteName: "jest tests",
      classNameTemplate: "{classname} - {title}",
      titleTemplate: "{classname} - {title}",
      ancestorSeparator: " > ",
      usePathForSuiteName: true,
      output: path.join(__dirname, "TEST.xml"),
      tsConfig: path.join(__dirname, 'tsconfig.json')
    }
  },
  collectCoverage: true
};

module.exports = config;