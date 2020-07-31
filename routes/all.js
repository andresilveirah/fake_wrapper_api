const { Router } = require('express')

const { gdpr: { tcfv2 }, ccpa, toQueryString } = require('./helpers/spClient')
const geolookup = require('./helpers/geolookup')

const router = Router()

router.post('/message-url', async (req, res) => {
  const ip = req.query.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const location = await geolookup(ip)
  const targetingParams = JSON.stringify({ location })
  const body = {...req.body, targetingParams, alwaysDisplayDNS: false }

  const gdprReq = {...body, ...body.gdpr}
  const ccpaReq = {...body, ...body.ccpa}

  console.log({ip,location})
  console.log({gdprReq})
  console.log({ccpaReq})

  let [gdprResult, ccpaResult] = await Promise.all([tcfv2.getMessage(body), ccpa.getMessage(ccpaReq)]);

  if (gdprResult.err || ccpaResult.err) {
    res.status(500).json({ err: { gdpr: gdprResult.err, ccpa: ccpaResult.err }})
    return
  }

  res.status(200).json({
    gdpr: { ...gdprResult, gdprApplies: location === "GDPR" },
    ccpa: { ...ccpaResult, ccpaApplies: location === "CCPA" }
  })
})

router.post('/consent', async (req, res) => {
  const ip = req.query.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const location = await geolookup(ip)
  const { body } = req;

  console.log({ip, location})
  console.log({body});

  let [gdprResult, ccpaResult] = await Promise.all([gdprConsent(body), ccpaConsent(body)])

  if (gdprResult.err || ccpaResult.err) {
    res.status(500).json({ err: { gdpr: gdprResult.err, ccpa: ccpaResult.err }})
    return
  }

  res.status(200).json({
    gdpr: { ...gdprResult, gdprApplies: location === "GDPR" },
    ccpa: { ...ccpaResult, ccpaApplies: location === "CCPA" }
  })

  async function gdprConsent(body){
    const gdprReq = {...body, ...body.gdpr}
    console.log({gdprReq})
    return location === "GDPR" ? tcfv2.consent(gdprReq) : tcfv2.getMessage(gdprReq);
  }

  async function ccpaConsent(body){
    const ccpaReq = {...body, ...body.ccpa}
    console.log({ccpaReq})
    return location === "CCPA" ? ccpa.consent(ccpaReq) : ccpa.getMessage(ccpaReq);
  }
})

module.exports = router