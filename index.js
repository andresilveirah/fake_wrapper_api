const express = require('express')
const { json } = require('body-parser')
var cors = require('cors')
var proxy = require('express-http-proxy');

const logger = require('./logger')

const config = { port: process.env.PORT || 80 }

const app = express()
app.use('/sp', proxy('cdn.privacy-mgmt.com'))
app.set('trust proxy', true)
app.use(cors())
app.use(json())
app.use(logger)
app.use(express.static('.'))
app.use('/tcfv2/v1/gdpr', require('./routes/tcfv2'))
app.use('/ccpa', require('./routes/ccpa'))
app.use('/all/v1', require('./routes/all'))

app.listen(config.port, () => console.log(`FAKE Wrapper API - listening on port ${config.port}`))
