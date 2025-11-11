// Setup crypto for Node.js v18 compatibility
// This must be loaded before any NestJS modules
const crypto = require('crypto');

if (typeof global.crypto === 'undefined') {
  global.crypto = crypto;
}

module.exports = crypto;
