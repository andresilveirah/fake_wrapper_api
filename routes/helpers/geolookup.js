const fetch = require('./fetch');

const timezoneToRegion = ({ timezone }) => {
  switch (true) {
    case /^America/.test(timezone):
      return 'CCPA'
    case /^Europe/.test(timezone):
      return 'GDPR'
    default:
      return 'Unknown'
  }
}

const geolookup = async (ip) =>
  fetch(`http://ip-api.com/json/${ip}`)
  .then(timezoneToRegion)

module.exports = geolookup
