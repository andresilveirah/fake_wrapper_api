const fetch = require('node-fetch')

module.exports = (...args) => fetch(...args).then(response => response.json())