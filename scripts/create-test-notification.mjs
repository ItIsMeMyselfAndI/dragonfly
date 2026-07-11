import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { createClient } from "@supabase/supabase-js";

const MONGODB_URI = process.env.MONGODB_URI;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

async function resolveUserIdByEmail(email) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY; cannot resolve --email. Pass --userId instead.",
    );
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  let page = 1;
  const perPage = 200;
  while (true) {
    const {
      data,
      error,
    } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Supabase admin error: ${error.message}`);
    const match = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (match) return match.id;
    if (data.users.length < perPage) break;
    page++;
  }
  throw new Error(`No Supabase user found with email "${email}".`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { userId, email, title, body, details, severity } = args;

  let recipientId = userId;
  if (!recipientId && email) {
    recipientId = await resolveUserIdByEmail(email);
  }
  if (!recipientId) {
    console.error(
      "Usage: node --env-file=.env.local scripts/create-test-notification.mjs --email you@example.com\n" +
        "   or: node --env-file=.env.local scripts/create-test-notification.mjs --userId <supabase-uuid>",
    );
    process.exit(1);
  }
  if (!MONGODB_URI) {
    console.error("Missing MONGODB_URI in environment.");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log(`Connected to MongoDB. Targeting recipientId=${recipientId}`);

  const notifications = mongoose.connection.collection("notifications");

  const doc = {
    _id: randomUUID(),
    recipientId,
    recipientKind: "user",
    category: "feature",
    severity: severity || "warning",
    title: title || "Heads up: a test inbox message",
    body:
      body ||
      "This was created by the inbox tester. Use “View details” to open the full message in a modal.",
    details:
      details ||
      [
        "This is the expanded content shown inside the modal.",
        "",
        "• The full message body lives here.",
        "• Every action from the original card is available below.",
        "• Triggering an action closes the modal automatically.",
        "",
        "You can create messages like this directly in the database — the UI renders and handles them generically, no extra code required.",
      ].join("\n"),
    icon: "Megaphone",
    actionButtons: [
      {
        id: "expand",
        label: "View details",
        style: "secondary",
        type: "expand",
      },
      {
        id: "open-settings",
        label: "Open settings",
        style: "primary",
        type: "redirect",
        path: "/settings?section=keys",
      },
      {
        id: "docs",
        label: "Docs",
        style: "secondary",
        type: "external_link",
        url: "https://supabase.com/docs",
      },
      {
        id: "dismiss",
        label: "Dismiss",
        style: "ghost",
        type: "dismiss",
      },
    ],
    actions: {
      read: { value: false, at: null, permanent: false },
      dismiss: { value: false, at: null, permanent: false },
      delete: { value: false, at: null, permanent: false },
      expand: { value: false, at: null, permanent: false },
      redirect: { value: false, at: null, permanent: false },
      external_link: { value: false, at: null, permanent: false },
      callback: { value: false, at: null, permanent: false },
    },
    expiresAt: null,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await notifications.insertOne(doc);
  console.log(`Inserted notification ${result.insertedId}`);
  console.log(
    "Log in as the target user and open /notification — it appears in the Unread tab.",
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
