export type StockStatus = "in-stock" | "low" | "out";

export type MountType = "Through-hole" | "SMD";

/**
 * Structured spec sheet for a component. Universal fields apply to every
 * part; category-specific groups surface the values that matter for that
 * class of component (per BOM spec rubric).
 */
export interface ComponentDetails {
  // Universal
  mounting: MountType;
  package: string; // e.g. "DIP-28", "SOIC-14", "Axial", "TO-220"
  voltageMin: number; // Vcc / Vdd min (V)
  voltageMax: number; // Vcc / Vdd max (V)

  // Passive
  primaryValue?: string; // "10 kΩ", "100 µF", "10 µH"
  powerRating?: string; // "1/4 W"
  tolerance?: string; // "±5%"

  // Semiconductor
  forwardVoltage?: string; // "2.0 V"
  maxCurrent?: string; // "200 mA"
  thresholdVoltage?: string; // "2.5 V"

  // IC
  logicFamily?: string; // "74HC", "CMOS", "TTL"
  ioVoltage?: number; // logic level out (V)
  pinCount?: number;

  // Electromechanical
  nominalVoltage?: number; // required input (V)
  currentDraw?: string; // "120 mA stall"
  contactRating?: string; // relay contacts
}

export interface StoreOption {
  id: string;
  name: string;
  storeName: string;
  price: number;
  link: string;
  inStock: boolean;
  isCheapest: boolean;
}

export interface Component {
  id: string;
  name: string;
  partNumber: string;
  specs: string;
  unitPrice: number;
  qty: number;
  stock: StockStatus;
  stockCount?: number;
  category: "MCU" | "Sensor" | "Actuator" | "Logic" | "Power" | "Passive";
  pins?: string[];
  details?: ComponentDetails;
  storeOptions?: StoreOption[];
}

export interface Substitute {
  id: string;
  name: string;
  partNumber: string;
  specs: string;
  unitPrice: number;
  matchScore: number;
  note: string;
}

export interface CompatibilityAlert {
  id: string;
  severity: "warning" | "info";
  title: string;
  message: string;
  componentId?: string;
}

export const initialBOM: Component[] = [
  {
    id: "c1",
    name: "Arduino Nano",
    partNumber: "ATmega328P",
    specs: "5V · 16MHz · 22 GPIO",
    unitPrice: 516.2,
    qty: 1,
    stock: "in-stock",
    stockCount: 412,
    category: "MCU",
    pins: ["D2", "D3", "D9"],
    details: {
      mounting: "Through-hole",
      package: "DIP-30",
      voltageMin: 4.5,
      voltageMax: 5.5,
      logicFamily: "AVR / TTL-compat",
      ioVoltage: 5,
      pinCount: 30,
      maxCurrent: "40 mA per pin",
    },
  },
  {
    id: "c2",
    name: "IR Reflectance Array",
    partNumber: "QTR-8RC",
    specs: "8-ch · digital · 3-5V",
    unitPrice: 725,
    qty: 1,
    stock: "in-stock",
    stockCount: 86,
    category: "Sensor",
    pins: ["D2"],
    details: {
      mounting: "Through-hole",
      package: "Breakout 8-pin",
      voltageMin: 3.3,
      voltageMax: 5.0,
      ioVoltage: 5,
      currentDraw: "100 mA (LEDs on)",
      pinCount: 8,
    },
  },
  {
    id: "c3",
    name: "TB6612FNG Motor Driver",
    partNumber: "TB6612FNG",
    specs: "Dual H-bridge · 1.2A · 2.5–13.5V",
    unitPrice: 275.5,
    qty: 1,
    stock: "in-stock",
    stockCount: 240,
    category: "Actuator",
    pins: ["D3", "D9"],
    details: {
      mounting: "SMD",
      package: "SSOP-24",
      voltageMin: 2.5,
      voltageMax: 13.5,
      nominalVoltage: 7.4,
      maxCurrent: "1.2 A continuous / 3.2 A peak",
      ioVoltage: 5,
    },
  },
  {
    id: "c4",
    name: "Micro Gear Motor",
    partNumber: "DG01D-E",
    specs: "6V · 200 RPM · 1:48",
    unitPrice: 185.6,
    qty: 2,
    stock: "in-stock",
    stockCount: 1080,
    category: "Actuator",
    details: {
      mounting: "Through-hole",
      package: "JST-2",
      voltageMin: 3,
      voltageMax: 7.2,
      nominalVoltage: 6,
      currentDraw: "70 mA free / 800 mA stall",
    },
  },
  {
    id: "c5",
    name: "Active Piezo Buzzer",
    partNumber: "HYDZ-12V",
    specs: "12V · 85 dB · 2.3 kHz",
    unitPrice: 81.2,
    qty: 1,
    stock: "low",
    stockCount: 9,
    category: "Actuator",
    pins: ["D9"],
    details: {
      mounting: "Through-hole",
      package: "Axial 2-lead",
      voltageMin: 9,
      voltageMax: 15,
      nominalVoltage: 12,
      currentDraw: "30 mA",
    },
  },
  {
    id: "c6",
    name: "Quad NAND Gate",
    partNumber: "SN74HC00N",
    specs: "2-V to 6-V · 14-DIP",
    unitPrice: 31.9,
    qty: 1,
    stock: "out",
    stockCount: 0,
    category: "Logic",
    details: {
      mounting: "Through-hole",
      package: "DIP-14",
      voltageMin: 2,
      voltageMax: 6,
      logicFamily: "74HC (CMOS)",
      ioVoltage: 5,
      pinCount: 14,
    },
  },
  {
    id: "c7",
    name: "Li-ion Battery Pack",
    partNumber: "18650-2S",
    specs: "7.4V · 2600mAh · JST",
    unitPrice: 823.6,
    qty: 1,
    stock: "in-stock",
    stockCount: 58,
    category: "Power",
    details: {
      mounting: "Through-hole",
      package: "2× 18650 holder",
      voltageMin: 6.0,
      voltageMax: 8.4,
      nominalVoltage: 7.4,
      currentDraw: "2600 mAh capacity",
      contactRating: "5 A fuse",
    },
  },
];

export const substitutesFor: Record<string, Substitute[]> = {
  c6: [
    {
      id: "s1",
      name: "Quad NAND Gate (SMD)",
      partNumber: "SN74HC00DR",
      specs: "2-V to 6-V · SOIC-14",
      unitPrice: 24.36,
      matchScore: 98,
      note: "Identical electricals, SMD footprint. 8.4k in stock.",
    },
    {
      id: "s2",
      name: "Quad NAND Gate (CMOS)",
      partNumber: "CD4011BE",
      specs: "3-V to 18-V · 14-DIP",
      unitPrice: 22.04,
      matchScore: 92,
      note: "Wider Vcc range, slower switching. 1.2k in stock.",
    },
  ],
};

export const compatibilityAlerts: CompatibilityAlert[] = [
  {
    id: "a1",
    severity: "warning",
    title: "Voltage mismatch",
    message:
      "MCU outputs 5V logic but buzzer expects 12V drive. A MOSFET low-side switch has been suggested.",
    componentId: "c5",
  },
];