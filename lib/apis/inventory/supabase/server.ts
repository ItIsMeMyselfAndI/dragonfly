import { ItemModel } from "../types";
import { supabase } from "@/lib/supabase/client";

export async function getAllItems(): Promise<ItemModel[]> {
  const { data, error } = await supabase.from("inventory").select("*");

  if (error) throw new Error(`Error fetching components: ${error.message}`);

  // Map snake_case from DB to camelCase for Frontend
  return (data || []).map((item) => ({
    id: item.id,
    name: item.name,
    partNumber: item.part_number,
    shortDesc: item.shortDesc,
    unitPrice: item.unit_price,
    stock: item.stock,
    stockCount: item.stock_count,
    category: item.category,
    pins: item.pins,
    details: item.details,
  }));
}

export async function getItemById(id: string): Promise<ItemModel | undefined> {
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return undefined; // Not found
    throw new Error(`Error fetching component: ${error.message}`);
  }

  return {
    id: data.id,
    name: data.name,
    partNumber: data.part_number,
    shortDesc: data.shortDesc,
    unitPrice: data.unit_price,
    stock: data.stock,
    stockCount: data.stock_count,
    category: data.category,
    pins: data.pins,
    details: data.details,
  };
}

export async function createItem(component: ItemModel): Promise<ItemModel> {
  const { data, error } = await supabase
    .from("inventory")
    .insert([
      {
        id: component.id,
        name: component.name,
        part_number: component.partNumber,
        shortDesc: component.shortDesc,
        unit_price: component.unitPrice,
        stock: component.stock,
        stock_count: component.stockCount,
        category: component.category,
        pins: component.pins,
        details: component.details,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(`Error creating component: ${error.message}`);

  return {
    id: data.id,
    name: data.name,
    partNumber: data.part_number,
    shortDesc: data.shortDesc,
    unitPrice: data.unit_price,
    stock: data.stock,
    stockCount: data.stock_count,
    category: data.category,
    pins: data.pins,
    details: data.details,
  };
}

export async function updateItem(
  id: string,
  updatedItem: Partial<ItemModel>,
): Promise<ItemModel | undefined> {
  // Map camelCase to snake_case for the update
  const updatePayload: any = {};
  if ("name" in updatedItem) updatePayload.name = updatedItem.name;
  if ("partNumber" in updatedItem)
    updatePayload.part_number = updatedItem.partNumber;
  if ("shortDesc" in updatedItem)
    updatePayload.shortDesc = updatedItem.shortDesc;
  if ("unitPrice" in updatedItem)
    updatePayload.unit_price = updatedItem.unitPrice;
  if ("stock" in updatedItem) updatePayload.stock = updatedItem.stock;
  if ("stockCount" in updatedItem)
    updatePayload.stock_count = updatedItem.stockCount;
  if ("category" in updatedItem) updatePayload.category = updatedItem.category;
  if ("pins" in updatedItem) updatePayload.pins = updatedItem.pins;
  if ("details" in updatedItem) updatePayload.details = updatedItem.details;

  const { data, error } = await supabase
    .from("inventory")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Error updating component: ${error.message}`);
  if (!data) return undefined;

  return {
    id: data.id,
    name: data.name,
    partNumber: data.part_number,
    shortDesc: data.shortDesc,
    unitPrice: data.unit_price,
    stock: data.stock,
    stockCount: data.stock_count,
    category: data.category,
    pins: data.pins,
    details: data.details,
  };
}

export async function createItemsBatch(
  components: ItemModel[],
): Promise<ItemModel[]> {
  const { data, error } = await supabase
    .from("inventory")
    .insert(
      components.map((c) => ({
        id: c.id,
        name: c.name,
        part_number: c.partNumber,
        shortDesc: c.shortDesc,
        unit_price: c.unitPrice,
        stock: c.stock,
        stock_count: c.stockCount,
        category: c.category,
        pins: c.pins,
        details: c.details,
      })),
    )
    .select();

  if (error)
    throw new Error(`Error creating components batch: ${error.message}`);
  return data.map((d) => ({
    id: d.id,
    name: d.name,
    partNumber: d.part_number,
    shortDesc: d.shortDesc,
    unitPrice: d.unit_price,
    stock: d.stock,
    stockCount: d.stock_count,
    category: d.category,
    pins: d.pins,
    details: d.details,
  }));
}

export async function deleteItem(id: string): Promise<boolean> {
  const { error } = await supabase.from("inventory").delete().eq("id", id);

  if (error) throw new Error(`Error deleting component: ${error.message}`);
  return true;
}
