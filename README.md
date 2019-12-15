# fake_wrapper_api

## Routes

### `GET /message?foo=bar`

```json
{
  "url": "https://notice.sp-prod.net/?message_id=66281",
  "uuid": "cfa454f8-635b-43e5-b6ba-1fbff7e56fa9",
  "foo": "bar"
}
```

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
  "uuid": "cfa454f8-635b-43e5-b6ba-1fbff7e56fa9",
  "euconsent": "BOnf5gkOnf5gkAGABBENCm-AAAAqWADABUADQAUg",
  "foo": "bar"
}
```