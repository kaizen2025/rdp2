// babel.config.js - CONFIGURATION BABEL POUR LES TESTS

module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: 'current'
      }
    }],
    ['@babel/preset-react', {
      runtime: 'automatic'
    }]
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-transform-object-rest-spread'
  ],
  env: {
    test: {
      plugins: [
        'transform-es2015-modules-commonjs'
      ]
    }
  }
};
