#!/usr/bin/env node
// Creates the prod Zettle Pusher webhook subscription and prints the raw JSON
// response plus the backend/.env lines that need to change.
//
// Usage:   cd backend && node scripts/create-prod-webhook.mjs
// Reads:   backend/.env  ->  ZETTLE_CLIENT_ID, ZETTLE_API_KEY
import "dotenv/config";
import crypto from "node:crypto";
import process from "node:process";
import { ofetch } from "ofetch";

const AUTH_URL = "https://oauth.zettle.com/token";
const SUBSCRIPTIONS_URL = "https://pusher.izettle.com/organizations/self/subscriptions";
const DEFAULT_DESTINATION = "https://api-drift.tihlde.org/api/zettle/webhook";

const G1582 = 0x01b21dd213814000n;
function uuidV1() {
  const ts = BigInt(Date.now()) * 10000n + G1582;
  const buf = Buffer.alloc(16);
  buf.writeUInt32BE(Number(ts & 0xffffffffn), 0);
  buf.writeUInt16BE(Number((ts >> 32n) & 0xffffn), 4);
  buf.writeUInt16BE(Number((ts >> 48n) & 0x0fffn) | 0x1000, 6);
  buf.writeUInt16BE((crypto.randomInt(0, 0x3fff) & 0x3fff) | 0x8000, 8);
  crypto.randomBytes(6).copy(buf, 10);
  buf[10] |= 0x01;
  const h = buf.toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const clientId = process.env.ZETTLE_CLIENT_ID;
const apiKey = process.env.ZETTLE_API_KEY;
if (!clientId || !apiKey) {
  console.error(
    "Missing ZETTLE_CLIENT_ID / ZETTLE_API_KEY.\n" +
      "Create backend/.env (copy backend/.env.example) and fill in the credentials.",
  );
  process.exit(1);
}

const destination = process.env.ZETTLE_WEBHOOK_DESTINATION ?? DEFAULT_DESTINATION;
const contactEmail = process.env.ZETTLE_WEBHOOK_CONTACT_EMAIL ?? "drift@tihlde.org";
const eventNames = ["PurchaseCreated", "ProductCreated"];

const { access_token } = await ofetch(AUTH_URL, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    client_id: clientId,
    assertion: apiKey,
  }).toString(),
});

const body = {
  uuid: uuidV1(),
  transportName: "WEBHOOK",
  eventNames,
  destination,
  contactEmail,
};
console.log("Creating subscription:\n" + JSON.stringify(body, null, 2) + "\n");

try {
  const res = await ofetch(SUBSCRIPTIONS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${access_token}` },
    body,
  });
  console.log("Raw response:\n" + JSON.stringify(res, null, 2) + "\n");
  console.log(
    "--- Change in backend/.env, then redeploy the backend ---\n" +
      `ZETTLE_WEBHOOK_SIGNING_KEY=${res.signingKey}\n` +
      `# Destination registered with Zettle: ${res.destination}\n` +
      "# The old placeholder value (super-secret-do-not-use-in-production) is no longer valid.",
  );
} catch (err) {
  console.error("Subscription request failed:");
  console.error(err.data ?? err.message ?? err);
  process.exit(1);
}
