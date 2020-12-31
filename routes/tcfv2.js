const { Router } = require('express')

const { gdpr: { tcfv2 } } = require('./helpers/spClient')

const router = Router()

router.post('/native-message/', (req, res) =>
  tcfv2.nativeMessage(req.body).then(({ err, ...restResponse }) =>
        err ?
          res.status(500).json({ err }) :
          res.status(200).json({ ...restResponse })
      ))

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

module.exports = router
