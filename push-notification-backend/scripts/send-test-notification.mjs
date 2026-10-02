/**
 * Sends a test notification through the running backend.
 *
 * Usage:
 *   npm run test:notify -- --userId=user-123
 *   npm run test:notify -- --userId=user-123 --title="Hi" --body="There"
 *   npm run test:notify -- --all            # every registered device
 *   npm run test:notify -- --topic=news     # send to a topic
 */

const args = process.argv.slice(2);

function readArg(name) {
  const prefix = `--${name}=`;
  const match = args.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

const baseUrl = readArg('url') ?? process.env.BACKEND_URL ?? 'http://localhost:4000';
const userId = readArg('userId');
const topic = readArg('topic');
const title = readArg('title') ?? 'Test notification';
const body = readArg('body') ?? 'Sent from push-notification-backend';

const payload = { title, body, ...(topic ? { topic } : {}) };
if (!topic && !userId && !args.includes('--all')) {
  console.error('Provide --userId=<id>, --topic=<name>, or --all.');
  process.exit(1);
}
if (userId) {
  payload.userId = userId;
}

let health;
try {
  health = await fetch(`${baseUrl}/health`).then((res) => res.json());
} catch (error) {
  console.error(`Cannot reach ${baseUrl} (${error.message}). Start the backend with: npm run dev`);
  process.exit(1);
}
console.log(`[test] backend ok, ${health.devices} registered device(s)`);

if (!topic && userId) {
  const devices = await fetch(`${baseUrl}/devices?userId=${encodeURIComponent(userId)}`).then(
    (res) => res.json(),
  );
  if (devices.count === 0) {
    console.error(`[test] no devices registered for userId "${userId}" — open the app first.`);
    process.exit(1);
  }
  console.log(`[test] ${devices.count} device(s) for ${userId}`);
}

const response = await fetch(`${baseUrl}/notify`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

const result = await response.json();
console.log(`[test] ${response.status}`, JSON.stringify(result, null, 2));
process.exit(response.ok ? 0 : 1);