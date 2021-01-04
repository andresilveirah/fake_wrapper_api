const { Router } = require('express')

const { gdpr: { tcfv2 }, ccpa } = require('./helpers/spClient')
const geolookup = require('./helpers/geolookup')

const router = Router()

const gdprConsent = async (body, location) => {
  const gdprReq = {...body, ...body.gdpr}
  console.log({gdprReq})
  return location === "GDPR" ? tcfv2.consent(gdprReq) : tcfv2.getMessage(gdprReq);
}

const ccpaConsent = async (body, location) => {
  const ccpaReq = {...body, ...body.ccpa}
  console.log({ccpaReq})
  return location === "CCPA" ? ccpa.consent(ccpaReq) : ccpa.getMessage(ccpaReq);
}


/*
{
    "requestUUID": String,
    "authId": String?,
    "accountId": Number,
    "multiCampaign": Boolean, // when false, indicates a single property is used for multiple legislations
    "legislations": {
        "gdpr?": {
          "propertyHref": String,
          "propertyId": Number,
          "targetingParams": Object,
          "campaignEnv": "prod" | "stage",
          "uuid": String?,
          "meta": String?
        },
        "ccpa?": {
          "propertyHref": String,
          "propertyId": Number,
          "targetingParams": Object,
          "campaignEnv": "prod" | "stage",
          "uuid": String?,
          "meta": String?
        }
    }
}
*/
router.post('/native-message', async (req, res) => {
  const ip = req.query.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const location = await geolookup(ip)
  const targetingParams = JSON.stringify({ location })
  const body = {...req.body, targetingParams, alwaysDisplayDNS: false }

  const gdprReq = {...body, ...body.gdpr}
  const ccpaReq = {...body, ...body.ccpa}

  console.log({ ip,location })
  console.log({ gdprReq })
  console.log({ ccpaReq })

  let [gdprResult, ccpaResult] = await Promise.all([
    tcfv2.nativeMessage(gdprReq),
    ccpa.getMessage(ccpaReq)
  ]);

  // if (gdprResult.err || ccpaResult.err) {
  //   res.status(500).json({ err: { gdpr: gdprResult.err, ccpa: ccpaResult.err }})
  //   return
  // }

  const appliedLegislation = location === "GDPR" ? gdprResult : ccpaResult

  res.status(200).json({
    message: {
      legislation: location,
      msgJSON: appliedLegislation.msgJSON,
      choiceOptions: appliedLegislation.choiceOptions,
      stackInfo: appliedLegislation.stackInfo
    },
    gdpr: gdprResult,
    ccpa: { 
      applies: location === "CCPA",
      uuid: ccpaResult.uuid,
      userConsent: ccpaResult.userConsent,
      meta: ccpaResult.meta
    }
  })
})

router.post('/consent', async (req, res) => {
  const ip = req.query.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const location = await geolookup(ip)
  const { body } = req;

  console.log({ip, location})
  console.log({body});

  let [gdprResult, ccpaResult] = await Promise.all([
    gdprConsent(body, location),
    ccpaConsent(body, location)
  ])

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