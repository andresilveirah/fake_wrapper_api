const { Router } = require('express')
const { ccpa } = require('./helpers/spClient')

const router = Router()

router.get('/message-url', (req, res) =>
  ccpa.getMessage(req.query).then(({ err, ...restResponse }) =>
      err ?
        res.status(500).json({ err }) :
        res.status(200).json({ ...restResponse })
    ))

router.post('/consent/:actionType', (req, res) =>
  ccpa.consent({ actionType: req.params.actionType, ...req.body })
    .then(({ err, ...restResponse }) =>
      err ?
         res.status(500).json({ err }) :
         res.status(200).json({ ...restResponse })
  ))

module.exports = router
