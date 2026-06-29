import { ItemModel } from "./types";

// const API_BASE = "/api/v1/inventory";
const API_BASE = "/api/v2/inventory";

export async function getAllComponents(): Promise<ItemModel[]> {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error("Failed to fetch components");
  return res.json();
}

export async function getComponent(id: string): Promise<ItemModel> {
  const res = await fetch(`${API_BASE}/${id}`);
  if (!res.ok) throw new Error("Failed to fetch component");
  return res.json();
}

export async function createComponent(
  component: ItemModel,
): Promise<ItemModel> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(component),
  });
  if (!res.ok) throw new Error("Failed to create component");
  return res.json();
}

export async function updateComponent(
  id: string,
  component: Partial<ItemModel>,
): Promise<ItemModel> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(component),
  });
  if (!res.ok) throw new Error("Failed to update component");
  return res.json();
}

export async function deleteComponent(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete component");
}
