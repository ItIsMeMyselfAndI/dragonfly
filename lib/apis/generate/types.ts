export interface GeneratedSpecs {
  specs: Array<{
    componentName: string;
    computedSpecs: string;
    reasoning: string;
    calculation: { formula: string; result: string };
  }>;
  summary: string;
}

export interface GeneratedBOM {
  items: Array<{
    id: string;
    name: string;
    partNumber: string;
    unitPrice: number;
    stock: "IN_STOCK" | "OUT";
    storeOptions: Array<{
      id: string;
      price: number;
      inStock: boolean;
      isCheapest: boolean;
    }>;
  }>;
  alerts: Array<{ id: string; message: string; severity: "info" | "warning" | "error" }>;
  tag: string;
}

export interface GeneratedFlow {
  name: string;
  tag: "Robotics" | "IoT" | "Power" | "Networking" | "Mechatronics" | "N/A";
  nodes: Array<{ id: string; positionX: number; positionY: number }>;
  edges: Array<{
    id: string;
    sourceId: string;
    targetId: string;
    label: string;
    type: "power" | "signal" | "logic" | "i2c";
  }>;
}
