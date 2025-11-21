// Setup crypto for Node.js compatibility
// This must be loaded before any NestJS modules
// Note: Node.js 22 has native crypto support, but this polyfill ensures compatibility
const crypto = require('crypto');

if (typeof global.crypto === 'undefined') {
  global.crypto = crypto;
}

module.exports = crypto;
