const path = require('path');

const config = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsConfig: path.join(__dirname, 'tsconfig.json')
    }
  },
  collectCoverage: true
};

module.exports = config;