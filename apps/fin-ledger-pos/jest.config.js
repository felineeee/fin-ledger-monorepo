module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'CommonJS',
          moduleResolution: 'Node',
          target: 'ES2022',
        },
      },
    ],
  },

  transformIgnorePatterns: ['/node_modules/(?!(\\.pnpm|kysely)/)'],

  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@fin-ledger/(.*)$': '<rootDir>/../../../packages/$1/src',
    '^(\\.\\.?/.*)\\.js$': '$1',
  },
};
