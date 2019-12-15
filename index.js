const express = require('express')
const { json } = require('body-parser')
const logger = require('./logger')

const config = { port: process.env.PORT || 80 }

const app = express()

app.use(json())
app.use(logger)

app.get('/message', (req, res) => {
  res.status(200).json({
    url: 'https://notice.sp-prod.net/?message_id=66281',
    uuid: 'cfa454f8-635b-43e5-b6ba-1fbff7e56fa9',
    ...req.query
  })
})

app.post('/action/:type', (req, res) => {
  res.status(200).json({
    uuid: 'cfa454f8-635b-43e5-b6ba-1fbff7e56fa9',
    euconsent: 'BOnf5gkOnf5gkAGABBENCm-AAAAqWADABUADQAUg',
    ...req.body
  })
})

app.listen(config.port, () => console.log(`AMP - listening on port ${config.port}`))