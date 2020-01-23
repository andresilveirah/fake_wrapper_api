const express = require('express')
const { json } = require('body-parser')
const fetch = require('node-fetch');

const logger = require('./logger')

const config = { port: process.env.PORT || 80 }

const app = express()

app.use(json())
app.use(logger)

const title = {
  text: "Hello World",
  style: {
    fontFamily: 'Gill Sans Extrabold, sans-serif',
    fontSize: '24px',
    color: '#fc7e7e',
    backgroundColor: '#cecece'
  },
  customFields: {
    fooTitle: 'barTitle'
  }
}

const body = {
  text: "This is the body of the message. A lot of cool text and stuff. ",
  style: {
    fontFamily: 'Gill Sans Extrabold, sans-serif',
    fontSize: '14px',
    color: '#fc7e7e',
    backgroundColor: '#cecece'
  },
  customFields: {
    fooBody: 'barBody'
  }
}

const accept = {
  text: "Accept",
  style: {
    fontFamily: 'Gill Sans Extrabold, sans-serif',
    fontSize: '18px',
    color: '#fc7e7e',
    backgroundColor: '#cecece'
  },
  customFields: {
    fooActionAccept: 'barActionAccept'
  },
  choiceType: 11,
  choiceId: 492690
}

const reject = {
  text: "Reject",
  style: {
    fontFamily: 'Gill Sans Extrabold, sans-serif',
    fontSize: '18px',
    color: '#fc7e7e',
    backgroundColor: '#cecece'
  },
  customFields: {
    fooActionReject: 'barActionReject'
  },
  choiceType: 13,
  choiceId: 492691
}

const showPm = {
  text: "Show Options",
  style: {
    fontFamily: 'Gill Sans Extrabold, sans-serif',
    fontSize: '18px',
    color: '#fc7e7e',
    backgroundColor: '#cecece'
  },
  customFields: {
    fooActionShowOptions: 'barActionShowOptions'
  },
  choiceType: 12,
  choiceId: 492692
}

const dismiss = {
  text: "×",
  style: {
    fontFamily: 'Gill Sans Extrabold, sans-serif',
    fontSize: '24px',
    color: '#fc7e7e',
    backgroundColor: '#cecece'
  },
  customFields: {
    fooActionDismiss: 'barActionDismiss'
  },
  choiceType: 15,
  choiceId: 492689
}

const msgJSON = {
	title,
	body,
	actions: [accept, reject, showPm, dismiss],
	customFields: {
    fooMessage: 'barMessage'
  }
}

const realWrapperApiUrl = 'https://wrapper-api.sp-prod.net'

const fetchRealWrapperApi = (url, body) => fetch(`${realWrapperApiUrl}${url}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(body)
})

app.post('/gdpr/native-message', (req, res) => {
  fetchRealWrapperApi('/gdpr/message-url', req.body)
    .then(response => response.json())
    .then(({ url, err, ...restResponse }) => {
      if(err) {
        return res.status(500).json({ err })
      }

      return url ?
        res.status(200).json({ ...restResponse, msgJSON }) :
        res.status(200).json({ ...restResponse })
    })
})

app.post('/gdpr/consent/', (req, res) => {
  fetchRealWrapperApi('/gdpr/consent', req.body)
    .then(response => response.json())
    .then(response => {
      const { err, ...restResponse } = response
      if(err) {
        return res.status(500).json({ err })
      }

      return res.status(200).json({ ...restResponse })
    })
})

app.listen(config.port, () => console.log(`FAKE Wrapper API - listening on port ${config.port}`))
