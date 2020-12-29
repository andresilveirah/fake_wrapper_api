const fetch = require('./fetch')

const realWrapperApiUrl = 'https://wrapper-api.sp-prod.net'

const fetchRealWrapperApi = (url, body, options = { method: 'POST' }) =>
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
      getMessage: body => fetchRealWrapperApi('/tcfv2/v1/gdpr/message-url?inApp=true', body),
      consent: body => fetchRealWrapperApi('/tcfv2/v1/gdpr/consent?inApp=true', body),
    }
  },
  ccpa: {
    getMessage: body => fetchRealWrapperApi(`/ccpa/message-url?${toQueryString(body)}`, undefined, { method: 'GET' }),
    consent: body => fetchRealWrapperApi(`/ccpa/consent/${body.actionType}`, body)
  },
  toQueryString
}