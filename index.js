const express = require('express')
const { json } = require('body-parser')
const fetch = require('node-fetch');

const logger = require('./logger')

const config = { port: process.env.PORT || 80 }

const app = express()

app.use(json())
app.use(logger)

const title = {
  text: "Message Title",
  style: {
    fontFamily: 'Arial',
    fontSize: '34px',
    color: '#000000',
    backgroundColor: '#ffffff'
  },
  customFields: {
    fooTitle: 'barTitle'
  }
}

const body = {
  text: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam euismod fermentum tortor, eget commodo neque ullamcorper a. Etiam hendrerit sem velit, faucibus viverra justo viverra nec. Sed eu nulla et eros finibus egestas ut et ipsum. Nunc hendrerit metus eget ultrices pellentesque. Duis eget augue elit. Pellentesque ac ipsum dignissim, egestas urna eu, aliquam nunc. Ut vel maximus tellus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Vivamus ac ornare nulla. Vestibulum molestie orci nec sollicitudin suscipit. Nulla imperdiet euismod nisl, sit amet aliquam nibh fermentum et. Etiam molestie imperdiet tellus, nec fringilla enim condimentum eu. Nullam congue metus lacus, sit amet vehicula lacus maximus non. Aenean vel ipsum sit amet justo finibus malesuada et id ex.

Maecenas sit amet urna a mauris eleifend vehicula sed et est. Sed efficitur fringilla congue. In vitae malesuada mauris. Nunc malesuada, mi quis rutrum efficitur, nibh odio maximus dui, id tempor tellus arcu at nulla. Pellentesque rhoncus urna lacus, ac vestibulum lacus ullamcorper quis. Interdum et malesuada fames ac ante ipsum primis in faucibus. Donec tincidunt ut nisl vitae iaculis. Suspendisse sit amet vulputate erat, non tristique turpis.

Donec eget fermentum tortor. Mauris malesuada commodo ante, quis condimentum sem faucibus id. Ut aliquam aliquam tempus. Donec commodo ac enim nec elementum. Duis vehicula nunc a nunc tempus lobortis. Fusce ut faucibus neque. Nulla consequat feugiat hendrerit. Nunc et molestie nibh. Ut vitae dictum odio. Duis a dolor in dolor dictum pulvinar sed id lorem. Ut ac ornare velit, porta semper lacus.

Nam eget ipsum eget nibh euismod vulputate. Aenean metus tellus, tristique fermentum dictum in, aliquet non ante. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Quisque mollis, leo ac eleifend suscipit, velit ante hendrerit tortor, eleifend laoreet erat lectus eget eros. Vestibulum rutrum, ex vel efficitur ultricies, sem justo molestie ante, nec tempor urna justo vitae erat. Quisque eleifend rutrum ullamcorper. Sed mauris erat, rutrum ut condimentum in, ullamcorper ac massa. Suspendisse aliquet est nisi. Sed facilisis tortor vitae sapien lobortis, maximus faucibus lorem mollis. Morbi ultrices, nisi sed efficitur molestie, nisi magna ornare justo, quis congue neque nulla vitae magna. Nunc volutpat commodo tempus. Nullam scelerisque mauris erat, et hendrerit nibh commodo nec. Morbi at purus lacinia, auctor dolor nec, fringilla nulla. Duis aliquam nisi eu metus rutrum vehicula. Aenean fringilla in nisi eu aliquam. Donec tempus vel sapien sed dapibus.

Nullam rhoncus fermentum libero nec scelerisque. Phasellus id odio pharetra, pellentesque velit vel, vulputate libero. Duis efficitur finibus suscipit. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nullam accumsan lorem est, suscipit porttitor tortor semper a. Praesent suscipit quam urna, in tristique magna dignissim at. Integer dictum, odio vitae commodo faucibus, risus tortor convallis nunc, vel aliquam metus neque sed ex. Nullam et eleifend odio, nec eleifend ex. Aenean urna turpis, blandit vel eleifend sed, eleifend nec urna.`,
  style: {
    fontFamily: 'Verdana',
    fontSize: '14px',
    color: '#303030',
    backgroundColor: '#ffffff'
  },
  customFields: {
    fooBody: 'barBody'
  }
}

const accept = {
  text: "I Accept",
  style: {
    fontFamily: 'Arial',
    fontSize: '16px',
    color: '#ffffff',
    backgroundColor: '#1890ff'
  },
  customFields: {
    fooActionAccept: 'barActionAccept'
  },
  choiceType: 11,
  choiceId: 492690
}

const reject = {
  text: "I Reject",
  style: {
    fontFamily: 'Arial',
    fontSize: '16px',
    color: '#585858',
    backgroundColor: '#ebebeb'
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
    fontFamily: 'Arial',
    fontSize: '16px',
    color: '#1890ff',
    backgroundColor: '#ffffff'
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

const vendorGrants = {
  "5e4a5fbf26de4a77922b38a6": {
    vendorGrant: true,
    purposeGrants: {
      "5e87321eb31ef52cd96cc552": true,
      "5e87321eb31ef52cd96cc553": true,
      "5e87321eb31ef52cd96cc554": true,
      "5e87321eb31ef52cd96cc555": true,
      "5e87321eb31ef52cd96cc556": true,
    }
  },
  "5e7ced57b8e05c5a7d171cda": {
    vendorGrant: false,
    purposeGrants: {
      "5e87321eb31ef52cd96cc552": false,
      "5e87321eb31ef52cd96cc553": true,
      "5e87321eb31ef52cd96cc554": true,
      "5e87321eb31ef52cd96cc555": true,
      "5e87321eb31ef52cd96cc556": true,
    }
  },
  "5e37fc3e56a5e60e003a7124": {
    vendorGrant: false,
    purposeGrants: {
      "5e87321eb31ef52cd96cc552": false,
      "5e87321eb31ef52cd96cc553": false,
      "5e87321eb31ef52cd96cc554": false,
      "5e87321eb31ef52cd96cc555": false,
      "5e87321eb31ef52cd96cc556": false,
    }
  }
}

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
      if (err) {
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
      if (err) {
        return res.status(500).json({ err })
      }

      return res.status(200).json({ ...restResponse })
    })
})

app.post('/tcfv2/v1/gdpr/message-url/', (req, res) => {
  fetchRealWrapperApi('/tcfv2/v1/gdpr/message-url?inApp=true', req.body)
    .then(response => response.json())
    .then(({ err, ...restResponse }) => {
      if (err) {
        return res.status(500).json({ err })
      }
      restResponse.userConsent = { vendorGrants, ...restResponse.userConsent };
      return res.status(200).json({ ...restResponse })
    })
})

app.post('/tcfv2/v1/gdpr/consent/', (req, res) => {
  fetchRealWrapperApi('tcfv2/v1/gdpr/consent?inApp=true', req.body)
    .then(response => response.json())
    .then(({ err, ...restResponse }) => {
      if (err) {
        return res.status(500).json({ err })
      }
      restResponse.userConsent = { vendorGrants, ...restResponse.userConsent };
      return res.status(200).json({ ...restResponse })
    })
})

// POST https://wrapper-api.sp-prod.net/tcfv2/v1/gdpr/custom-consent?inApp=true
// {
// 	"vendors": ["5e37fc3e56a5e60e003a7124"],
// 	"categories": [],
// 	"legIntCategories": [],
// 	"consentUUID": "2ce05e8d-0c1d-40d0-8872-ee95447f4aee",
// 	"propertyId": 7639
// }
app.post('/tcfv2/v1/gdpr/custom-consent/', (req, res) => {
  return res.status(200).json({
    consentUUID: req.body.consentUUID,
    specialFeatures: [],
    vendors: req.body.vendors,
    categories: req.body.categories,
    legIntCategories: req.body.legIntCategories
  })
})

app.listen(config.port, () => console.log(`FAKE Wrapper API - listening on port ${config.port}`))
