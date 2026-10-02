# Push Notification Backend

Express service (MVC) that stores device FCM tokens in **Supabase** and pushes notifications to the `vector-erp` mobile app via `firebase-admin`.

## Structure

```
src/
  server.js                 # entrypoint: env -> firebase init -> listen
  app.js                    # express app factory (json, routes, error handling)
  config/                   # env, supabase client, firebase admin
  models/                   # data access (Supabase queries)
  services/                 # business logic
  controllers/              # req/res handling
  routes/                   # route table
  middleware/               # asyncHandler, validation, error handler
  utils/                    # HttpError helpers
supabase/migrations/        # SQL for the device registry table
scripts/                    # dev helpers
```

Request flow: `routes -> controllers -> services -> models -> Supabase`.

## Setup

```bash
npm install
cp .env.example .env      # add SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
```

Apply the migration to your Supabase project:

```bash
supabase db push           # or paste supabase/migrations/*.sql into the SQL editor
```

This creates `public.push_devices` with a unique `token`, an index on `user_id`, and an `updated_at` trigger. The service-role key bypasses RLS; anon/authenticated only get `select`.

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
| `POST` | `/change` | Supabase webhook payload | Translate a DB change into a notification |

Tokens that FCM reports as invalid are pruned from `push_devices` automatically on send.

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

### Database webhooks

`POST /change` accepts a Supabase Postgres webhook body:

```jsonc
{ "type": "INSERT", "table": "items", "record": { "name": "Rose", "pcs": 10 } }
```

`src/services/webhook.service.js` maps `items`, `messages`, `payments`, and `production_orders` inserts to notifications; unmapped tables/change types return `{ ok: true, skipped: true }`. Add the webhook in Supabase Dashboard → Database → Webhooks, pointing at your deployed `/change` URL.

## App side

`vector-erp` registers its FCM token against `EXPO_PUBLIC_API_URL` on launch and deep links on tap. Set `EXPO_PUBLIC_API_URL` in `vector-erp/.env`; `10.0.2.2` reaches the host machine from an Android emulator.