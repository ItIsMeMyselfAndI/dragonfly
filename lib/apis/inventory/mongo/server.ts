import { connectToDatabase } from "@/lib/mongodb/connection";
import {
  InventoryModel,
  toItemModel,
  type InventoryPlain,
} from "@/lib/mongodb/models/inventory";
import { ItemModel, ItemDetails } from "../types";

function toInventoryDoc(item: ItemModel): Record<string, unknown> {
  return {
    _id: item.id,
    name: item.name,
    partNumber: item.partNumber,
    shortDesc: item.shortDesc,
    unitPrice: item.unitPrice,
    stock: item.stock,
    stockCount: item.stockCount,
    category: item.category,
    pins: item.pins,
    details: item.details,
  };
}

export async function getAllItems(): Promise<ItemModel[]> {
  await connectToDatabase();
  const docs = await InventoryModel.find({}).lean<InventoryPlain[]>();
  return docs.map(toItemModel);
}

export async function getItemById(
  id: string,
): Promise<ItemModel | undefined> {
  await connectToDatabase();
  const doc = await InventoryModel.findById(id).lean<InventoryPlain>();
  return doc ? toItemModel(doc) : undefined;
}

export async function createItem(component: ItemModel): Promise<ItemModel> {
  await connectToDatabase();
  const doc = await InventoryModel.create(toInventoryDoc(component));
  return toItemModel(doc.toObject() as InventoryPlain);
}

export async function updateItem(
  id: string,
  updatedItem: Partial<ItemModel>,
): Promise<ItemModel | undefined> {
  await connectToDatabase();
  const set: Record<string, unknown> = {};
  if ("name" in updatedItem) set.name = updatedItem.name;
  if ("partNumber" in updatedItem) set.partNumber = updatedItem.partNumber;
  if ("shortDesc" in updatedItem) set.shortDesc = updatedItem.shortDesc;
  if ("unitPrice" in updatedItem) set.unitPrice = updatedItem.unitPrice;
  if ("stock" in updatedItem) set.stock = updatedItem.stock;
  if ("stockCount" in updatedItem) set.stockCount = updatedItem.stockCount;
  if ("category" in updatedItem) set.category = updatedItem.category;
  if ("pins" in updatedItem) set.pins = updatedItem.pins;
  if ("details" in updatedItem) set.details = updatedItem.details;

  const doc = await InventoryModel.findByIdAndUpdate(
    id,
    { $set: set },
    { new: true },
  ).lean<InventoryPlain>();

  return doc ? toItemModel(doc) : undefined;
}

export async function createItemsBatch(
  components: ItemModel[],
): Promise<ItemModel[]> {
  await connectToDatabase();
  if (components.length === 0) return [];
  await InventoryModel.insertMany(components.map(toInventoryDoc), {
    ordered: false,
  });
  const ids = components.map((c) => c.id);
  const docs = await InventoryModel.find({ _id: { $in: ids } }).lean<InventoryPlain[]>();
  return docs.map(toItemModel);
}

export async function deleteItem(id: string): Promise<boolean> {
  await connectToDatabase();
  const result = await InventoryModel.deleteOne({ _id: id });
  return result.deletedCount === 1;
}

// --- Details (embedded inside the inventory item) ---

export async function getItemDetailsByInventoryId(
  inventoryId: string,
): Promise<ItemDetails | undefined> {
  await connectToDatabase();
  const doc = await InventoryModel.findById(inventoryId).lean<InventoryPlain>();
  return doc?.details;
}

export async function createItemDetails(
  details: ItemDetails,
): Promise<ItemDetails> {
  await connectToDatabase();
  const result = await InventoryModel.updateOne(
    { _id: details.inventoryId },
    { $set: { details } },
  );
  if (result.matchedCount === 0) {
    throw new Error(`Inventory item not found: ${details.inventoryId}`);
  }
  return details;
}

export async function createItemDetailsBatch(
  detailsList: ItemDetails[],
): Promise<ItemDetails[]> {
  await connectToDatabase();
  for (const details of detailsList) {
    await InventoryModel.updateOne(
      { _id: details.inventoryId },
      { $set: { details } },
      { upsert: false },
    );
  }
  return detailsList;
}

export async function updateItemDetails(
  inventoryId: string,
  details: ItemDetails,
): Promise<ItemDetails> {
  await connectToDatabase();
  const result = await InventoryModel.updateOne(
    { _id: inventoryId },
    { $set: { details } },
  );
  if (result.matchedCount === 0) {
    throw new Error(`Inventory item not found: ${inventoryId}`);
  }
  return details;
}
