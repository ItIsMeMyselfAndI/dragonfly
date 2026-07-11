import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error(
    "Missing MONGODB_URI. Run with: node --env-file=.env.local scripts/migrate-notifications-shape.mjs",
  );
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  const notifications = mongoose.connection.collection("notifications");
  const cursor = notifications.find({});
  let migrated = 0;
  let skipped = 0;

  for await (const doc of cursor) {
    // Already in the new shape: `actions` is the state group (has `.read`), not the button array.
    if (
      doc.actions &&
      !Array.isArray(doc.actions) &&
      doc.actions.read !== undefined
    ) {
      skipped++;
      continue;
    }

    const base = { value: false, at: null, permanent: false };
    const newActions = {
      read: { value: !!doc.read, at: doc.readAt ?? null, permanent: false },
      dismiss: {
        value: !!doc.dismissed,
        at: doc.dismissedAt ?? null,
        permanent: false,
      },
      delete: {
        value: !!doc.deleted,
        at: doc.deletedAt ?? null,
        permanent: !!doc.permanentlyDeleted,
      },
      expand: { ...base },
      redirect: { ...base },
      external_link: { ...base },
      callback: { ...base },
    };

    // Move the old button-definition array into `actionButtons` and overwrite
    // `actions` with the new grouped state object. (Setting + unsetting the
    // same path is not allowed, so we avoid $rename and just overwrite.)
    await notifications.updateOne(
      { _id: doc._id },
      {
        $set: {
          actionButtons: Array.isArray(doc.actions) ? doc.actions : [],
          actions: newActions,
        },
        $unset: {
          read: "",
          readAt: "",
          dismissed: "",
          dismissedAt: "",
          deleted: "",
          deletedAt: "",
          permanentlyDeleted: "",
        },
      },
    );
    migrated++;
  }

  console.log(
    `Migrated ${migrated} notification(s); skipped ${skipped} already in new shape.`,
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
