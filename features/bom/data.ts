export interface StoreOption {
  id: string;
  name: string;
  storeName: string;
  price: number;
  link: string;
  inStock: boolean;
  isCheapest: boolean;
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

export interface BomAlert {
  id?: string;
  severity: "warning" | "info";
  title: string;
  message: string;
  componentId?: string;
  partReference?: string;
}

export interface CompatibilityAlert extends BomAlert {
  id: string;
}

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
