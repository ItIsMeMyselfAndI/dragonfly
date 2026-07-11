import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI. Run with: node --env-file=.env.local scripts/seed.mjs");
  process.exit(1);
}

const inventorySchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    partNumber: { type: String, required: true },
    shortDesc: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    stock: { type: String, required: true },
    stockCount: { type: Number, required: true },
    category: { type: String, required: true },
    pins: { type: [String], default: [] },
    details: { type: Object, default: {} },
  },
  { _id: false, versionKey: false },
);

const projectSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    time: { type: String, required: true },
    tag: { type: String, required: true },
    components: { type: [Object], default: [] },
    nodes: { type: [Object], default: [] },
    edges: { type: [Object], default: [] },
    substitutes: { type: [Object], default: [] },
    specsReport: { type: Object, default: null },
  },
  { _id: false, versionKey: false },
);

const Inventory = mongoose.model("Inventory", inventorySchema);
const Project = mongoose.model("Project", projectSchema);

const items = [
  {
    _id: "item-0-seed",
    name: "ESP32-WROOM-32",
    partNumber: "ESP32-WROOM-32",
    shortDesc: "Dual-core WiFi+BLE MCU",
    unitPrice: 220,
    stock: "IN_STOCK",
    stockCount: 25,
    category: "MCU",
    pins: ["GND", "3V3", "EN", "IO0"],
    details: {
      inventoryId: "item-0-seed",
      mounting: "SMD",
      package: "QFN-38",
      ioVoltage: 3.3,
    },
  },
  {
    _id: "item-1-seed",
    name: "Resistor 10k",
    partNumber: "R-10K",
    shortDesc: "10kΩ 1/4W",
    unitPrice: 0.5,
    stock: "IN_STOCK",
    stockCount: 1000,
    category: "Passive",
    pins: ["1", "2"],
    details: {
      inventoryId: "item-1-seed",
      mounting: "THROUGH_HOLE",
      package: "AXIAL",
      primaryValue: "10k",
      powerRating: "0.25W",
      tolerance: "5%",
    },
  },
  {
    _id: "item-2-seed",
    name: "L298N Motor Driver",
    partNumber: "L298N",
    shortDesc: "Dual H-Bridge",
    unitPrice: 95,
    stock: "LOW",
    stockCount: 3,
    category: "Power",
    pins: ["OUT1", "OUT2", "IN1", "IN2", "VCC", "GND"],
    details: {
      inventoryId: "item-2-seed",
      mounting: "THROUGH_HOLE",
      package: "MULTIWATT15",
      maxCurrent: "2A",
      nominalVoltage: 12,
    },
  },
];

const projectId = "seed-project-1";
const project = {
  _id: projectId,
  name: "Seed Demo Project",
  time: new Date().toISOString(),
  tag: "Robotics",
  components: [
    { id: "comp-0-seed-project-1", inventoryId: "item-0-seed", qty: 1 },
    { id: "comp-1-seed-project-1", inventoryId: "item-2-seed", qty: 2 },
  ],
  nodes: [
    { id: "node-0-seed-project-1", componentId: "comp-0-seed-project-1", positionX: 100, positionY: 50 },
    { id: "node-1-seed-project-1", componentId: "comp-1-seed-project-1", positionX: 100, positionY: 300 },
  ],
  edges: [
    {
      id: "edge-0-seed-project-1",
      sourceId: "node-0-seed-project-1",
      targetId: "node-1-seed-project-1",
      sourceHandle: "bottom",
      targetHandle: "top",
      label: "PWM",
      type: "power",
    },
  ],
  substitutes: [],
  specsReport: null,
};

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  if (process.argv.includes("--reset")) {
    await Inventory.deleteMany({});
    await Project.deleteMany({});
    console.log("Cleared inventory and projects.");
  }

  await Inventory.insertMany(items, { ordered: false }).catch(() => {});
  await Project.findOneAndUpdate({ _id: projectId }, project, {
    upsert: true,
    returnDocument: "after",
  });
  console.log(`Seeded ${items.length} inventory items and project "${projectId}".`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
