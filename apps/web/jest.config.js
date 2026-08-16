/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['<rootDir>/e2e/', '<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/jest.style-mock.js',
    '^@/(.*)$': '<rootDir>/$1',
    '^@beaconvie/types$': '<rootDir>/../../packages/types/index.ts',
  },
  transform: {
    '^.+\\.(t|j)sx?$': ['babel-jest', { presets: ['next/babel'] }],
  },
};
