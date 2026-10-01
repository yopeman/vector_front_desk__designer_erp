# Push Notification Backend

Express + `firebase-admin` service that stores device FCM tokens and pushes notifications to the `vector-erp` mobile app.

## Setup

```bash
npm install
cp .env.example .env
```

The Firebase service account is resolved in this order:

1. `FIREBASE_SERVICE_ACCOUNT_JSON` (inline JSON, useful for CI)
2. `FIREBASE_SERVICE_ACCOUNT_PATH` (defaults to `./service-account.json`)
3. `../vector-erp/vector-erp-9b02d-firebase-adminsdk-fbsvc-cedbebb6c8.json`

```bash
npm run dev   # nodemon
npm start
```

## Endpoints

| Method | Path | Body | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | – | Liveness + registered device count |
| `POST` | `/devices` | `{ token, platform, userId? }` | Register / refresh a device token |
| `GET` | `/devices` | `?userId=` | List registered devices |
| `DELETE` | `/devices/:token` | – | Unregister a device |
| `POST` | `/notify` | `{ title, body\|data, tokens?\|userId?\|topic? }` | Send a notification |

Tokens are persisted to `data/devices.json`. Tokens that FCM reports as invalid are pruned automatically on send.

### Send an example notification

```bash
curl -X POST http://localhost:4000/notify \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "New booking",
    "body": "Table 4 booked at 19:00",
    "data": { "url": "/explore" }
  }'
```

`data.url` is used by the app for deep linking, so tapping the notification routes to that expo-router route.

Targeting options:

```jsonc
// all registered devices (default)
{ "title": "Hello", "body": "Everyone" }

// one user
{ "title": "Hello", "body": "Just you", "userId": "u1" }

// explicit token list
{ "title": "Hello", "body": "Device", "tokens": ["fcm-token-1"] }

// topic
{ "title": "Hello", "body": "Topic", "topic": "staff" }
```

## App side

`vector-erp` registers its FCM token against `EXPO_PUBLIC_API_URL` on launch and deep links on tap. Set `EXPO_PUBLIC_API_URL` in `vector-erp/.env`; `10.0.2.2` reaches the host machine from an Android emulator.