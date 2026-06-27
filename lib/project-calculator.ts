import { type Component } from "@/features/bom/data";
import { type ProjectTag } from "@/data/mock/projects";

export interface ProjectCartSummary {
  id: string;
  name: string;
  tag: ProjectTag;
  timestamp: string;
  totalPrice: number;
  items: (Component & { qtyPrice: number })[];
}

/**
 * Calculates the summary data from current BOM items.
 */
export const calculateProjectCartSummary = (
  name: string,
  tag: ProjectTag,
  items: Component[],
): ProjectCartSummary => {
  const itemsWithQtyPrice = items.map((item) => ({
    ...item,
    qtyPrice: item.unitPrice * item.qty,
  }));

  const totalPrice = itemsWithQtyPrice.reduce(
    (sum, item) => sum + item.qtyPrice,
    0,
  );

  return {
    id: `${name}-${Date.now()}`,
    name,
    tag,
    timestamp: new Date().toLocaleString(),
    totalPrice,
    items: itemsWithQtyPrice,
  };
};
