const express = require('express')
const { json } = require('body-parser')
const logger = require('./logger')

const config = { port: process.env.PORT || 80 }

const app = express()

app.use(json())
app.use(logger)

app.get('/gdpr/message-url', (req, res) => {
  res.status(200).json({
    url: "https://notice.sp-prod.net/?message_id=70171",
    uuid: 'cfa454f8-635b-43e5-b6ba-1fbff7e56fa9',
    meta: "{'foo': 'bar'}",
    consents: {
      consentString: "BOn2OwMOn2OwMAGABCENCn-AAAAqyABAFIA",
      status: "acceptedSome",
      acceptedVendors: ["ABCD"],
      acceptedPurposes: []
    },
    ...req.query
  })
})

app.post('/gdpr/consent/:type', (req, res) => {
  res.status(200).json({
    uuid: 'cfa454f8-635b-43e5-b6ba-1fbff7e56fa9',
    meta: "{'foo': 'bar'}",
    consents: {
      consentString: "BOn2OwMOn2OwMAGABCENCn-AAAAqyABAFIA",
      status: "acceptedSome",
      acceptedVendors: ["ABCD"],
      acceptedPurposes: []
    },
    ...req.body
  })
})

app.listen(config.port, () => console.log(`FAKE Wrapper API - listening on port ${config.port}`))
