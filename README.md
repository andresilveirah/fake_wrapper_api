# fake_wrapper_api

## Routes

### `GET gdpr/message-url?foo=bar`

```json
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

The server will send back in the response whatever was sent as query param. (E.g. `foo: bar`)

### `POST /action/:type`

Data:
```json
{
  "foo": "bar"
}
```

Response:

```json
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
  "meta": "{'foo': 'bar'}"
}
```

The server will send back in the response whatever was sent in the request's body. (E.g. `foo: bar`)
