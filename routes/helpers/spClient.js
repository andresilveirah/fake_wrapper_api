const fetch = require('./fetch')

const realWrapperApiUrl = 'https://cdn.privacy-mgmt.com/wrapper/tcfv2/v1/gdpr'

const fetchRealWrapperApi = (url, options = { method: 'POST' }) => body =>
  fetch(`${realWrapperApiUrl}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

const toQueryString = (params) => Object
  .keys(params)
  .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
  .join('&')

module.exports = {
  gdpr: {
    tcfv2: {
      nativeMessage: fetchRealWrapperApi('/native-message'),
      getMessage: fetchRealWrapperApi('/message-url?inApp=true'),
      consent: fetchRealWrapperApi('/consent?inApp=true'),
    }
  },
  ccpa: {
    getMessage: (body) => fetchRealWrapperApi(`/ccpa/message-url?${toQueryString(body)}`, undefined, { method: 'GET' })(body),
    consent: (body) => fetchRealWrapperApi(`/ccpa/consent/${body.actionType}`, body)(body)
  },
  toQueryString
}