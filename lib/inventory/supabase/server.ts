import { ItemModel } from "../types";
import { supabase } from "@/lib/supabase/client";

export async function getAllComponents(): Promise<ItemModel[]> {
  const { data, error } = await supabase.from("inventory").select("*");

  if (error) throw new Error(`Error fetching components: ${error.message}`);

  // Map snake_case from DB to camelCase for Frontend
  return (data || []).map((item) => ({
    id: item.id,
    name: item.name,
    partNumber: item.part_number,
    specs: item.specs,
    unitPrice: item.unit_price,
    qty: item.qty,
    stock: item.stock,
    stockCount: item.stock_count,
    category: item.category,
    pins: item.pins,
    details: item.details,
  }));
}

export async function getComponentById(
  id: string,
): Promise<ItemModel | undefined> {
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
    specs: data.specs,
    unitPrice: data.unit_price,
    qty: data.qty,
    stock: data.stock,
    stockCount: data.stock_count,
    category: data.category,
    pins: data.pins,
    details: data.details,
  };
}

export async function createComponent(
  component: ItemModel,
): Promise<ItemModel> {
  const { data, error } = await supabase
    .from("inventory")
    .insert([
      {
        id: component.id,
        name: component.name,
        part_number: component.partNumber,
        specs: component.specs,
        unit_price: component.unitPrice,
        qty: component.qty,
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
    specs: data.specs,
    unitPrice: data.unit_price,
    qty: data.qty,
    stock: data.stock,
    stockCount: data.stock_count,
    category: data.category,
    pins: data.pins,
    details: data.details,
  };
}

export async function updateComponent(
  id: string,
  updatedComponent: Partial<ItemModel>,
): Promise<ItemModel | undefined> {
  // Map camelCase to snake_case for the update
  const updatePayload: any = {};
  if ("name" in updatedComponent) updatePayload.name = updatedComponent.name;
  if ("partNumber" in updatedComponent)
    updatePayload.part_number = updatedComponent.partNumber;
  if ("specs" in updatedComponent) updatePayload.specs = updatedComponent.specs;
  if ("unitPrice" in updatedComponent)
    updatePayload.unit_price = updatedComponent.unitPrice;
  if ("qty" in updatedComponent) updatePayload.qty = updatedComponent.qty;
  if ("stock" in updatedComponent) updatePayload.stock = updatedComponent.stock;
  if ("stockCount" in updatedComponent)
    updatePayload.stock_count = updatedComponent.stockCount;
  if ("category" in updatedComponent)
    updatePayload.category = updatedComponent.category;
  if ("pins" in updatedComponent) updatePayload.pins = updatedComponent.pins;
  if ("details" in updatedComponent)
    updatePayload.details = updatedComponent.details;

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
    specs: data.specs,
    unitPrice: data.unit_price,
    qty: data.qty,
    stock: data.stock,
    stockCount: data.stock_count,
    category: data.category,
    pins: data.pins,
    details: data.details,
  };
}

export async function deleteComponent(id: string): Promise<boolean> {
  const { error } = await supabase.from("inventory").delete().eq("id", id);

  if (error) throw new Error(`Error deleting component: ${error.message}`);
  return true;
}
