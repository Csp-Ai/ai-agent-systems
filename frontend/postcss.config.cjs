// Proxy to the root PostCSS configuration to ensure consistent plugin versions
const path = require('path')
module.exports = require(path.resolve(__dirname, '..', 'postcss.config.js'))
