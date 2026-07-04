import { supabase } from "@/lib/supabase/client";
import { ItemDetails } from "../types";

export async function getItemDetailsByInventoryId(inventoryId: string): Promise<ItemDetails | undefined> {
  const { data, error } = await supabase
    .from("inventory_item_details")
    .select("*")
    .eq("inventory_id", inventoryId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return undefined;
    throw new Error(`Error fetching item details: ${error.message}`);
  }

  return {
    inventoryId: data.inventory_id,
    mounting: data.mounting,
    package: data.package,
    voltageMin: data.voltage_min,
    voltageMax: data.voltage_max,
    primaryValue: data.primary_value,
    powerRating: data.power_rating,
    tolerance: data.tolerance,
    forwardVoltage: data.forward_voltage,
    maxCurrent: data.max_current,
    thresholdVoltage: data.threshold_voltage,
    logicFamily: data.logic_family,
    ioVoltage: data.io_voltage,
    pinCount: data.pin_count,
    nominalVoltage: data.nominal_voltage,
    currentDraw: data.current_draw,
    contactRating: data.contact_rating,
  };
}

export async function createItemDetails(details: ItemDetails): Promise<ItemDetails> {
  const { data, error } = await supabase
    .from("inventory_item_details")
    .insert([
      {
        inventory_id: details.inventoryId,
        mounting: details.mounting,
        package: details.package,
        voltage_min: details.voltageMin,
        voltage_max: details.voltageMax,
        primary_value: details.primaryValue,
        power_rating: details.powerRating,
        tolerance: details.tolerance,
        forward_voltage: details.forwardVoltage,
        max_current: details.maxCurrent,
        threshold_voltage: details.thresholdVoltage,
        logic_family: details.logicFamily,
        io_voltage: details.ioVoltage,
        pin_count: details.pinCount,
        nominal_voltage: details.nominalVoltage,
        current_draw: details.currentDraw,
        contact_rating: details.contactRating,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(`Error creating item details: ${error.message}`);
  
  return details; // Returning input details as confirmation
}

export async function createItemDetailsBatch(
  detailsList: ItemDetails[],
): Promise<ItemDetails[]> {
  const { data, error } = await supabase
    .from("inventory_item_details")
    .insert(
      detailsList.map((details) => ({
        inventory_id: details.inventoryId,
        mounting: details.mounting,
        package: details.package,
        voltage_min: details.voltageMin,
        voltage_max: details.voltageMax,
        primary_value: details.primaryValue,
        power_rating: details.powerRating,
        tolerance: details.tolerance,
        forward_voltage: details.forwardVoltage,
        max_current: details.maxCurrent,
        threshold_voltage: details.thresholdVoltage,
        logic_family: details.logicFamily,
        io_voltage: details.ioVoltage,
        pin_count: details.pinCount,
        nominal_voltage: details.nominalVoltage,
        current_draw: details.currentDraw,
        contact_rating: details.contactRating,
      })),
    )
    .select();

  if (error) throw new Error(`Error creating item details batch: ${error.message}`);
  return detailsList;
}

export async function updateItemDetails(
  inventoryId: string,
  details: ItemDetails,
): Promise<ItemDetails> {
  const { data, error } = await supabase
    .from("inventory_item_details")
    .update({
        mounting: details.mounting,
        package: details.package,
        voltage_min: details.voltageMin,
        voltage_max: details.voltageMax,
        primary_value: details.primaryValue,
        power_rating: details.powerRating,
        tolerance: details.tolerance,
        forward_voltage: details.forwardVoltage,
        max_current: details.maxCurrent,
        threshold_voltage: details.thresholdVoltage,
        logic_family: details.logicFamily,
        io_voltage: details.ioVoltage,
        pin_count: details.pinCount,
        nominal_voltage: details.nominalVoltage,
        current_draw: details.currentDraw,
        contact_rating: details.contactRating,
    })
    .eq("inventory_id", inventoryId)
    .select()
    .single();

  if (error) throw new Error(`Error updating item details: ${error.message}`);
  
  return details;
}
