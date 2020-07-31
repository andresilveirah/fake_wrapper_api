const { Router } = require('express')

const { gdpr: { tcfv2 }, ccpa, toQueryString } = require('./helpers/spClient')
const geolookup = require('./helpers/geolookup')

const router = Router()

router.post('/message-url', async (req, res) => {
  const ip = req.query.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const location = await geolookup(ip)
  const targetingParams = JSON.stringify({ location })
  const body = {...req.body, targetingParams, alwaysDisplayDNS: false }

  console.log("IP: ", ip)
  console.log("Body to GDPR: ", body)
  console.log("Params to CCPA: ", toQueryString(body));

  let [gdprResult, ccpaResult] = await Promise.all([tcfv2.getMessage(body), ccpa.getMessage(body)]);

  if (gdprResult.err || ccpaResult.err) {
    res.status(500).json({ err: { gdpr: gdprResult.err, ccpa: ccpaResult.err }})
    return
  }

  res.status(200).json({
    gdpr: { ...gdprResult, gdprApplies: location === "GDPR" },
    ccpa: { ...ccpaResult, ccpaApplies: location === "CCPA" }
  })
})

module.exports = router