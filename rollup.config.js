const resolve = require('@rollup/plugin-node-resolve');
const cjs = require('@rollup/plugin-commonjs');
const nodePolyfills = require('rollup-plugin-polyfill-node');

module.exports = {
  input: 'index.js',
  output: {
    file: 'dist/heic-convert.js',
    format: 'iife'
  },
  plugins: [resolve(), cjs(), nodePolyfills()]
};
