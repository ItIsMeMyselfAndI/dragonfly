import mongoose, { Schema } from "mongoose";
import {
  StockStatus,
  ItemCategory,
  MountType,
  ItemDetails,
  ItemModel,
} from "@/lib/apis/inventory/types";

const ItemDetailsSchema = new Schema<ItemDetails>(
  {
    inventoryId: { type: String, required: true },
    mounting: { type: String, enum: Object.values(MountType) },
    package: { type: String },
    voltageMin: { type: Number },
    voltageMax: { type: Number },
    primaryValue: { type: String },
    powerRating: { type: String },
    tolerance: { type: String },
    forwardVoltage: { type: String },
    maxCurrent: { type: String },
    thresholdVoltage: { type: String },
    logicFamily: { type: String },
    ioVoltage: { type: Number },
    pinCount: { type: Number },
    nominalVoltage: { type: Number },
    currentDraw: { type: String },
    contactRating: { type: String },
  },
  { _id: false },
);

const InventorySchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    partNumber: { type: String, required: true },
    shortDesc: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    stock: { type: String, enum: Object.values(StockStatus), required: true },
    stockCount: { type: Number, required: true },
    category: {
      type: String,
      enum: Object.values(ItemCategory),
      required: true,
    },
    pins: { type: [String], default: [] },
    details: { type: ItemDetailsSchema, required: true },
  },
  { _id: false, versionKey: false },
);

export type InventoryDocument = mongoose.InferSchemaType<typeof InventorySchema>;
export type InventoryPlain = InventoryDocument;

export function toItemModel(doc: InventoryPlain): ItemModel {
  return {
    id: doc._id,
    name: doc.name,
    partNumber: doc.partNumber,
    shortDesc: doc.shortDesc,
    unitPrice: doc.unitPrice,
    stock: doc.stock,
    stockCount: doc.stockCount,
    category: doc.category,
    pins: doc.pins,
    details: doc.details,
  };
}

export const InventoryModel =
  (mongoose.models.Inventory as mongoose.Model<InventoryDocument>) ||
  mongoose.model<InventoryDocument>("Inventory", InventorySchema);
