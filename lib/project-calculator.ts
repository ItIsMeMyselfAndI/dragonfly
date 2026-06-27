import { getAllComponents } from "./inventory/client";
import { Component } from "./inventory/types";
import { ProjectDefinition, ProjectModel, ProjectTag } from "./project/types";
import { getProjectNodes } from "./project/client";

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
export const calculateProjectCost = async (
  project: ProjectDefinition | ProjectModel,
): Promise<number> => {
  let nodes: any[] = [];

  if ("nodes" in project) {
    nodes = project.nodes;
  } else {
    nodes = await getProjectNodes(project.id);
  }

  const componentIds = nodes.map((node) => node.componentId || node.id);
  const components = await getAllComponents();
  const items = componentIds
    .map((id) => components.find((item) => item.id === id))
    .filter((item) => item !== undefined);

  const itemsWithQtyPrice = items.map((item) => ({
    ...item,
    qtyPrice: item.unitPrice * item.qty,
  }));

  const totalPrice = itemsWithQtyPrice.reduce(
    (sum, item) => sum + item.qtyPrice,
    0,
  );

  return totalPrice;
};
