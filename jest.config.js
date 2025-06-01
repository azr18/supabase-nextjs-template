module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['@babel/preset-env'] }]
  },
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/nextjs/src/$1'
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/nextjs/.next/',
    '<rootDir>/nextjs/node_modules/'
  ],
  collectCoverageFrom: [
    'nextjs/src/**/*.{js,jsx,ts,tsx}',
    '!nextjs/src/**/*.d.ts',
    '!nextjs/src/**/node_modules/**'
  ]
}; 