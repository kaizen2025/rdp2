module.exports = {
  root: true,
  parser: "@babel/eslint-parser",
  parserOptions: {
    requireConfigFile: false,
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    }
  },
  env: {
    browser: true,
    node: true,
    es6: true
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended"
  ],
  settings: {
    react: {
      version: "detect"
    }
  },
  rules: {
    "no-console": "off",
    "react/prop-types": "off"
  }
};
