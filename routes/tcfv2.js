const { Router } = require('express')

const { gdpr: { tcfv2 } } = require('./helpers/spClient')

const router = Router()

router.post('/message-url/', (req, res) =>
  tcfv2.getMessage(req.body).then(({ err, ...restResponse }) =>
        err ?
          res.status(500).json({ err }) :
          res.status(200).json({ ...restResponse })
      ))

router.post('/consent/', (req, res) =>
  tcfv2.consent(req.body).then(({ err, ...restResponse }) =>
      err ?
        res.status(500).json({ err }) :
        res.status(200).json({ ...restResponse })
    ))

router.post('/custom-consent/', (req, res) =>
  tcfv2.customConsent(req.body).then(({ err, ...restResponse }) =>
      err ?
         res.status(500).json({ err }) :
         res.status(200).json({ ...restResponse })
    ))

module.exports = router
