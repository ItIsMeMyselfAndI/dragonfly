export enum StockStatus {
  IN_STOCK = "IN_STOCK",
  LOW = "LOW",
  OUT = "OUT",
}

export enum ItemCategory {
  MCU = "MCU",
  Sensor = "Sensor",
  Actuator = "Actuator",
  Logic = "Logic",
  Power = "Power",
  Passive = "Passive",
}

export enum MountType {
  THROUGH_HOLE = "THROUGH_HOLE",
  SMD = "SMD",
}

export interface ItemDetails {
  componentId: string;
  // Universal
  mounting: MountType;
  package: string;
  voltageMin: number;
  voltageMax: number;
  // Passive
  primaryValue?: string;
  powerRating?: string;
  tolerance?: string;
  // Semiconductor
  forwardVoltage?: string;
  maxCurrent?: string;
  thresholdVoltage?: string;
  // IC
  logicFamily?: string;
  ioVoltage?: number;
  pinCount?: number;
  // Electromechanical
  nominalVoltage?: number;
  currentDraw?: string;
  contactRating?: string;
}

export interface ItemModel {
  id: string;
  name: string;
  partNumber: string;
  specs: string;
  unitPrice: number;
  qty: number;
  stock: StockStatus;
  stockCount?: number;
  category: ItemCategory;
  pins: string[];
  details?: ItemDetails;
}
