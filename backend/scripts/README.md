Creates the prod Zettle Pusher API webhook subscription and prints the raw JSON
response plus the `backend/.env` lines that need to change afterwards.

### What it does

1. Loads `backend/.env` (`ZETTLE_CLIENT_ID`, `ZETTLE_API_KEY`) via `dotenv`.
   Exits with an error if the credentials are missing.
2. Exchanges the API key for a short-lived (2h) access token at
   `https://oauth.zettle.com/token` (JWT-bearer grant).
3. Generates a UUID **v1** — Zettle requires version 1 and requires it to be
   unique per subscription. `crypto.randomUUID()` is v4, so the script has a
   small single-shot UUIDv1 generator (`SIMPLIFIED:` not the full RFC monotonic
   implementation; upgrade to `uuid.v1()` if creating subscriptions in a loop).
4. POSTs the subscription to
   `https://pusher.izettle.com/organizations/self/subscriptions`.
5. Prints the raw JSON response, then the `backend/.env` change to make
   (`ZETTLE_WEBHOOK_SIGNING_KEY`).

The script takes no parameters — it always subscribes to `PurchaseCreated` and
`ProductCreated`, which requires the `READ:PURCHASE` and `READ:PRODUCT` scopes
on the token.

### Usage

```bash
cd backend
cp .env.example .env          # fill in ZETTLE_CLIENT_ID and ZETTLE_API_KEY
node scripts/create-prod-webhook.mjs
```

### Env variables

| Variable                       | Required | Default                                    | Purpose                                 |
| ------------------------------ | -------- | ------------------------------------------ | --------------------------------------- |
| `ZETTLE_CLIENT_ID`             | yes      | —                                          | App client ID from the Developer Portal |
| `ZETTLE_API_KEY`               | yes      | —                                          | API key JWT issued for that client ID   |
| `ZETTLE_WEBHOOK_DESTINATION`   | no       | `https://api-drift.tihlde.org/api/zettle/webhook` | Where Zettle pushes events       |
| `ZETTLE_WEBHOOK_CONTACT_EMAIL` | no       | `drift@tihlde.org`                         | Error notifications                     |

### After it succeeds

1. Copy the printed `ZETTLE_WEBHOOK_SIGNING_KEY=...` line into `backend/.env`
   (replacing the placeholder), then redeploy the backend.
2. Zettle immediately sends a `TestMessage` POST to the destination. The
   backend must be reachable at the destination URL and return a valid response
   within 10 seconds, or the subscription is deleted per the retry policy.
3. Incoming events carry an `X-iZettle-Signature` header: HMAC-SHA256 hexdigest
   of `<timestamp>.<payload>` using the signing key. The backend verifies it in
   `src/zettle/index.ts`.

### Before creating the subscription

Make sure the deployed backend actually serves `/api/*` — otherwise the create
call succeeds (the frontend fallback returns 200 for the TestMessage) but every
event is silently dropped. Verify with:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://api-drift.tihlde.org/api/purchases
# anything but 404 with HTML means the backend routes are live
```

### Sources

- [Pusher API reference](https://developer.zettle.com/docs/api/pusher/api-reference-md)
- [Create subscriptions guide](https://developer.zettle.com/docs/api/pusher/user-guides/create-subscriptions)
- [OAuth assertion grant](https://developer.zettle.com/docs/api/oauth/user-guides/set-up-app-authorisation/set-up-authorisation-assertion-grant)
