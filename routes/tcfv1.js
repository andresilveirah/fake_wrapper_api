const { Router } = require('express')

const { gdpr: { tcfv1 } } = require('./helpers/spClient')

const router = Router()

router.post('/message-url', (req, res) =>
  tcfv1.getMessage(req.body).then(({ err, ...restResponse }) =>
        err ?
          res.status(500).json({ err }) :
          res.status(200).json({ ...restResponse })
    ))

router.post('/consent/', (req, res) =>
  tcfv1.consent(req.body).then(({ err, ...restResponse }) =>
        err ?
          res.status(500).json({ err }) :
          res.status(200).json({ ...restResponse })
    ))

module.exports = router
