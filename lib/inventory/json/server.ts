import { promises as fs } from "fs";
import path from "path";
import { ItemModel, StockStatus } from "../types";

const DATA_PATH = path.join(process.cwd(), "data", "inventory.json");

function mapStockStatus(stock: string): StockStatus {
  switch (stock) {
    case "in-stock":
      return StockStatus.IN_STOCK;
    case "low":
      return StockStatus.LOW;
    case "out":
      return StockStatus.OUT;
    default:
      return StockStatus.OUT; // Default to OUT if unknown
  }
}

async function readInventory(): Promise<ItemModel[]> {
  try {
    const data = await fs.readFile(DATA_PATH, "utf-8");
    const components = JSON.parse(data);
    return components.map((c: any) => ({
      ...c,
      stock: mapStockStatus(c.stock),
    }));
  } catch (error) {
    if ((error as any).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeInventory(inventory: ItemModel[]): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(inventory, null, 2), "utf-8");
}

export async function getAllComponents(): Promise<ItemModel[]> {
  return await readInventory();
}

export async function getComponentById(
  id: string,
): Promise<ItemModel | undefined> {
  const inventory = await readInventory();
  return inventory.find((c) => c.id === id);
}

export async function createComponent(
  component: ItemModel,
): Promise<ItemModel> {
  const inventory = await readInventory();
  inventory.push(component);
  await writeInventory(inventory);
  return component;
}

export async function updateComponent(
  id: string,
  updatedComponent: Partial<ItemModel>,
): Promise<ItemModel | undefined> {
  const inventory = await readInventory();
  const index = inventory.findIndex((c) => c.id === id);
  if (index === -1) return undefined;

  inventory[index] = { ...inventory[index], ...updatedComponent };
  await writeInventory(inventory);
  return inventory[index];
}

export async function deleteComponent(id: string): Promise<boolean> {
  const inventory = await readInventory();
  const index = inventory.findIndex((c) => c.id === id);
  if (index === -1) return false;

  inventory.splice(index, 1);
  await writeInventory(inventory);
  return true;
}
