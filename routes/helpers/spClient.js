const fetch = require('./fetch')

// const realWrapperApiUrl = 'https://cdn.privacy-mgmt.com/wrapper'

const fetchRealWrapperApi = (url, options = { method: 'POST' }) => body =>
  fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json'
    },
    body: options.method === 'POST' ? JSON.stringify(body) : null
  })

const toQueryString = (params) => Object
  .keys(params)
  .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
  .join('&')

module.exports = {
  gdpr: {
    tcfv2: {
      nativeMessage: fetchRealWrapperApi('https://cdn.privacy-mgmt.com/wrapper/tcfv2/v1/gdpr/native-message'),
      getMessage: fetchRealWrapperApi('https://cdn.privacy-mgmt.com/wrapper/tcfv2/v1/gdpr/message-url?inApp=true'),
      consent: fetchRealWrapperApi('https://cdn.privacy-mgmt.com/wrapper/tcfv2/v1/gdpr/consent?inApp=true'),
    }
  },
  ccpa: {
    getMessage: (body) => fetchRealWrapperApi(`https://wrapper-api.sp-prod.net/ccpa/message-url?${toQueryString(body)}`, { method: 'GET' })(body),
    consent: (body) => fetchRealWrapperApi(`https://wrapper-api.sp-prod.net/ccpa/consent/${body.actionType}`, body)(body)
  },
  toQueryString
}