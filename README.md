# fake_wrapper_api

## Routes

### `GET /gdpr/message-url?foo=bar` 

``` json
{
  "url": "https://notice.sp-prod.net/?message_id=70171",
  "uuid": "cfa454f8-635b-43e5-b6ba-1fbff7e56fa9",
  "meta": "{'foo': 'bar'}",
  "consents": {
    "consentString": "BOn2OwMOn2OwMAGABCENCn-AAAAqyABAFIA",
    "status": "acceptedSome",
    "acceptedVendors": ["ABCD"],
    "acceptedPurposes": []
  },
  "foo": "bar"
}
```

The server will send back in the response whatever was sent as query param.(E.g. `foo: bar` )

### `POST /gdpr/consent/` 

Data:

``` json
{
  "foo": "bar"
}
```

Response:

``` json
{
  "uuid": "cfa454f8-635b-43e5-b6ba-1fbff7e56fa9",
  "meta": "{'foo': 'bar'}",
  "userConsent": {
    "euconsent": "BOn2OwMOn2OwMAGABCENCn-AAAAqyABAFIA",
    "acceptedVendors": ["ABCD"],
    "acceptedPurposes": []
  },
  "meta": "{'foo': 'bar'}"
}
```

### `POST /tcfv2/v1/gdpr/message-url/

data:

``` json
{
    "accountId": 22,
    "propertyId": 7055,
    "requestUUID": "f727ac36-cefc-4141-ae11-d128cdf9fba0",
    "uuid": "c2cbf0fe-b228-46ec-b2f3-553aff395938",
    "meta": "{}",
    "propertyHref": "https://a-demo-property/",
    "campaignEnv": "public",
    "targetingParams": "{}"
}
```

Response:

``` json
{
    "uuid": "c2cbf0fe-b228-46ec-b2f3-553aff395938",
    "userConsent": {
        "acceptedCategories": [
            "5d287f273e5ba6241423f58d",
            "5d287f273e5ba6241423f58e"
        ],
        "acceptedVendors": [
            "5b07836aecb3fe2955eba270",
            "5b07834e620739293cc7e3a1",
            "5b07834e620739293cc7e389",
            "5b07834e620739293cc7e392"
        ],
        "TCData": {
            "IABTCF_CmpSdkID": 6,
            "IABTCF_CmpSdkVersion": 1,
            "IABTCF_PolicyVersion": 2,
            "IABTCF_gdprApplies": 1,
            "IABTCF_PublisherCC": "AA",
            "IABTCF_PurposeOneTreatment": 0,
            "IABTCF_UseNonStandardStacks": 1,
            "IABTCF_TCString": "TCFv2 Consent String Here",
            "IABTCF_VendorConsents": "000001000101000",
            "IABTCF_VendorLegitimateInterests": "000001000101000",
            "IABTCF_PurposeConsents": "000001000101000",
            "IABTCF_PurposeLegitimateInterests": "000001000101000",
            "IABTCF_SpecialFeaturesOptIns": "000001000101000",
            "IABTCF_PublisherRestrictions42": "2",
            "IABTCF_PublisherRestrictions66": "0",
            "IABTCF_PublisherConsent": "000001000101000",
            "IABTCF_PublisherLegitimateInterests": "000001000101000",
            "IABTCF_PublisherCustomPurposesConsents": "000001000101000",
            "IABTCF_PublisherCustomPurposesLegitimateInterests": "000001000101000"
        }
    },
    "meta": "{}"
}
```

### `POST /tcfv2/v1/gdpr/consent` 

Data:

``` json
{
  "consents": {
  	"acceptedCategories": [
    ],
    "acceptedVendors": [
    ]
},
  "accountId":22,
  "propertyId":2372,
  "requestUUID":"aef7ab22-9226-4fdc-a568-bbc93898e0e4",
  "privacyManagerId":"5c0e81b7d74b3c30c6852301",
  "uuid":"ba64bd3f-50f3-47fc-b2ca-c3e184ec892b",
  "meta": "{\"resolved\":true,\"mmsCookies\":[\"_sp_v1_uid=40893b63-a414-47ee-a3d8-ca85d8c2fb08;\",\"_sp_v1_consent=1!0:0:0:0;\",\"_sp_v1_csv=1;\",\"_sp_v1_lt=1:msg|true:;\",\"_sp_v1_ss=1:H4sIAAAAAAAAAItWqo5RKimOUbKKhjHySnNydGKUUpHYJWCJ6traWFwSSjooBuWBGAZ4lMcCANQdvj55AAAA;\",\"_sp_v1_opt=1:;\",\"_sp_v1_data=2:69961:1579278773:0:1:0:1:0:0:94161803-facf-4cdd-8045-efecf9d5c56a:91500;\"],\"messageId\":\"91500\"}",
  "propertyHref":"https://mobile.demo/",
  "actionType":11,
  "requestFromPM":true
}
```

Response:

``` json
{
    "uuid": "ba64bd3f-50f3-47fc-b2ca-c3e184ec892b",
    "meta": "{\"resolved\":true,\"mmsCookies\":[\"_sp_v1_uid=40893b63-a414-47ee-a3d8-ca85d8c2fb08;\",\"_sp_v1_consent=1!0:0:0:0;\",\"_sp_v1_csv=1;\",\"_sp_v1_lt=1:msg|true:;\",\"_sp_v1_ss=1:H4sIAAAAAAAAAItWqo5RKimOUbKKhjHySnNydGKUUpHYJWCJ6traWFwSSjooBuWBGAZ4lMcCANQdvj55AAAA;\",\"_sp_v1_opt=1:;\",\"_sp_v1_data=2:69961:1579278773:0:1:0:1:0:0:94161803-facf-4cdd-8045-efecf9d5c56a:91500;\"],\"messageId\":\"91500\"}",
    "userConsent": {
        "euconsent": "BOu7TqZOu7TqZAGABCENC9-AAAAuGADABUADQAUg",
        "acceptedVendors": [
            "5b07836aecb3fe2955eba270",
            "5b07834e620739293cc7e3a1",
            "5b07834e620739293cc7e389",
            "5b07834e620739293cc7e392"
        ],
        "acceptedCategories": [
            "5d287f273e5ba6241423f58d",
            "5d287f273e5ba6241423f58e"
        ],
        "TCData": {
            "IABTCF_CmpSdkID": 6,
            "IABTCF_CmpSdkVersion": 1,
            "IABTCF_PolicyVersion": 2,
            "IABTCF_gdprApplies": 1,
            "IABTCF_PublisherCC": "AA",
            "IABTCF_PurposeOneTreatment": 0,
            "IABTCF_UseNonStandardStacks": 1,
            "IABTCF_TCString": "TCFv2 Consent String Here",
            "IABTCF_VendorConsents": "000001000101000",
            "IABTCF_VendorLegitimateInterests": "000001000101000",
            "IABTCF_PurposeConsents": "000001000101000",
            "IABTCF_PurposeLegitimateInterests": "000001000101000",
            "IABTCF_SpecialFeaturesOptIns": "000001000101000",
            "IABTCF_PublisherRestrictions42": "2",
            "IABTCF_PublisherRestrictions66": "0",
            "IABTCF_PublisherConsent": "000001000101000",
            "IABTCF_PublisherLegitimateInterests": "000001000101000",
            "IABTCF_PublisherCustomPurposesConsents": "000001000101000",
            "IABTCF_PublisherCustomPurposesLegitimateInterests": "000001000101000"
        }
    }
}
```

The server will send back in the response whatever was sent in the request's body.(E.g. `foo: bar` )

