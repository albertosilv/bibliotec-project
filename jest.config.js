module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./src/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  reporters: [
    "default",
    ["jest-html-reporter", {
      "outputPath": "test-report.html",
      "pageTitle": "Relatório de Testes"
    }]
  ]

};