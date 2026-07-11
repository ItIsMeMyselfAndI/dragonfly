import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error(
    "Missing MONGODB_URI. Run with: node --env-file=.env.local scripts/migrate-projects-ownership.mjs",
  );
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  const projects = mongoose.connection.collection("projects");

  // Legacy projects have no `userId`. Mark them as shared/public so they
  // remain visible to everyone after personalization is enabled. New projects
  // created by the app already carry userId + isPublic:false.
  const result = await projects.updateMany(
    { $or: [{ userId: { $exists: false } }, { userId: null }] },
    { $set: { userId: null, isPublic: true } },
  );

  console.log(
    `Marked ${result.modifiedCount} existing project(s) as shared/public.`,
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
