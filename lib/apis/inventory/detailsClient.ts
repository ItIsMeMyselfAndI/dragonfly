import { ItemDetails } from "./types";

const API_BASE = "/api/v2/inventory/details";

export async function getItemDetails(inventoryId: string): Promise<ItemDetails> {
  const res = await fetch(`${API_BASE}/${inventoryId}`);
  if (!res.ok) throw new Error("Failed to fetch item details");
  return res.json();
}

export async function updateItemDetails(
  inventoryId: string,
  details: ItemDetails,
): Promise<ItemDetails> {
  const res = await fetch(`${API_BASE}/${inventoryId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(details),
  });
  if (!res.ok) throw new Error("Failed to update item details");
  return res.json();
}

export async function createItemDetails(
  details: ItemDetails,
): Promise<ItemDetails> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(details),
  });
  if (!res.ok) throw new Error("Failed to create item details");
  return res.json();
}

export async function createItemDetailsBatch(
  detailsList: ItemDetails[],
): Promise<ItemDetails[]> {
  const res = await fetch(`${API_BASE}/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(detailsList),
  });
  if (!res.ok) throw new Error("Failed to create item details batch");
  return res.json();
}

