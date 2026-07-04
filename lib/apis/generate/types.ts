import { ItemModel } from "@/lib/apis/inventory/types";
import { BomAlert } from "@/features/bom/data";
import {
  ComponentEdgeType,
  ComponentNodeType,
  ProjectComponentModel,
  ProjectTagEnum,
} from "../project/types";

export interface GeneratedSpecs {
  specs: Array<{
    componentName: string;
    computedSpecs: string;
    reasoning: string;
    calculation: { formula: string; result: string };
  }>;
  summary: string;
}

// export interface GeneratedBOMItem {
//   id: string;
//   name: string;
//   partNumber: string;
//   unitPrice: number;
//   stock: StockStatus;
//   stockCount: number;
//   category: string;
//   specs?: string;
//   pins: string[];
//   details?: ItemDetails;
//   storeOptions: Array<{
//     id: string;
//     price: number;
//     inStock: boolean;
//     isCheapest: boolean;
//   }>;
// }

export interface GeneratedBOM {
  items: ItemModel[];
  components: ProjectComponentModel[];
  alerts: BomAlert[];
  tag: ProjectTagEnum;
}

export interface GeneratedFlow {
  name: string;
  tag: ProjectTagEnum;
  nodes: ComponentNodeType[];
  edges: ComponentEdgeType[];
}
