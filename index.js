const express = require('express')
const { json } = require('body-parser')

const fetch = require('./fetch');
const logger = require('./logger')
const geolookup = require('./geolookup')

const config = { port: process.env.PORT || 80 }

const app = express()

app.use(json())
app.use(logger)

const realWrapperApiUrl = 'https://wrapper-api.sp-prod.net'

const fetchRealWrapperApi = (url, body, options = { method: 'POST' }) => fetch(`${realWrapperApiUrl}${url}`, {
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

app.get('/ccpa/message-url', (req, res) =>
  fetchRealWrapperApi(`/ccpa/message-url?${toQueryString(req.query)}`, undefined, { method: 'GET' })
    .then(({ err, ...restResponse }) =>
      err ?
        res.status(500).json({ err }) :
        res.status(200).json({ ...restResponse })
    ))

app.post('/ccpa/consent/:actionType', (req, res) =>
  fetchRealWrapperApi(`/ccpa/consent/${req.params.actionType}`, req.body)
  .then(({ err, ...restResponse }) =>
      err ?
         res.status(500).json({ err }) :
         res.status(200).json({ ...restResponse })
  ))

app.post('/gdpr/native-message', (req, res) =>
  fetchRealWrapperApi('/gdpr/message-url', req.body)
    .then(({ err, ...restResponse }) =>
        err ?
          res.status(500).json({ err }) :
          res.status(200).json({ ...restResponse })
    ))

app.post('/gdpr/consent/', (req, res) =>
  fetchRealWrapperApi('/gdpr/consent', req.body)
    .then(({ err, ...restResponse }) =>
        err ?
          res.status(500).json({ err }) :
          res.status(200).json({ ...restResponse })
    ))

app.post('/tcfv2/v1/gdpr/message-url/', (req, res) =>
  fetchRealWrapperApi('/tcfv2/v1/gdpr/message-url?inApp=true', req.body)
    .then(({ err, ...restResponse }) =>
        err ?
          res.status(500).json({ err }) :
          res.status(200).json({ ...restResponse })
      ))

app.post('/tcfv2/v1/gdpr/consent/', (req, res) =>
  fetchRealWrapperApi('/tcfv2/v1/gdpr/consent?inApp=true', req.body)
    .then(({ err, ...restResponse }) =>
      err ?
        res.status(500).json({ err }) :
        res.status(200).json({ ...restResponse })
    ))

app.post('/tcfv2/v1/gdpr/custom-consent/', (req, res) =>
  fetchRealWrapperApi('/tcfv2/v1/gdpr/consent?inApp=true', req.body)
    .then(({ err, ...restResponse }) =>
      err ?
         res.status(500).json({ err }) :
         res.status(200).json({ ...restResponse })
    ))

app.post('/all/v1/message-url', async (req, res) => {
  const location = await geolookup(req.query.ip || req.ip)
  const targetingParams = JSON.stringify({ location })
  const body = {...req.body, targetingParams, alwaysDisplayDNS: false }

  console.log(body)
  console.log(toQueryString(body));

  let [gdprResult, ccpaResult] = await Promise.all([
    fetchRealWrapperApi('/tcfv2/v1/gdpr/message-url?inApp=true', body),
    fetchRealWrapperApi(`/ccpa/message-url?${toQueryString(body)}`, undefined, { method: 'GET' })
  ]);

  if (gdprResult.err || ccpaResult.err) {
    res.status(500).json({ err: {
      gdpr: gdprResult.err,
      ccpa: ccpaResult.err
    }})
  } else {
    res.status(200).json({
      gdpr: { ...gdprResult, gdprApplies: location === "GDPR" },
      ccpa: { ...ccpaResult, ccpaApplies: location === "CCPA" }
    })
  }
})

app.listen(config.port, () => console.log(`FAKE Wrapper API - listening on port ${config.port}`))
