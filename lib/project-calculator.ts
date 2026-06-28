import { getAllComponents } from "./inventory/client";
import { Component } from "./inventory/types";
import { ProjectNodeModel } from "./project/types";
import { getProjectNodes } from "./project/client";

export const calculateProjectCost = async (
  projectId: string,
): Promise<number> => {
  let nodes: ProjectNodeModel[] = [];

  nodes = await getProjectNodes(projectId);

  if (nodes.length === 0) {
    return 0;
  }

  const allInventory = await getAllComponents();
  const items: Component[] = nodes
    .map((node) => node.componentId)
    .map((id) => allInventory.find((item) => item.id === id))
    .filter((item) => item !== undefined);

  const totalPrice = items.reduce(
    (sum, item) => sum + item.unitPrice * item.qty,
    0,
  );

  return totalPrice;
};
