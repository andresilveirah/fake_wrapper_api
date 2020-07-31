const express = require('express')
const { json } = require('body-parser')

const logger = require('./logger')

const config = { port: process.env.PORT || 80 }

const app = express()
app.set('trust proxy', true)

app.use(json())
app.use(logger)

app.use('/gdpr/v1/gdpr', require('./routes/tcfv1'))
app.use('/tcfv2/v1/gdpr', require('./routes/tcfv2'))
app.use('/ccpa', require('./routes/ccpa'))
app.use('/all/v1', require('./routes/tcfv2'))

app.listen(config.port, () => console.log(`FAKE Wrapper API - listening on port ${config.port}`))
