import { Bot, Wifi, Network, Cpu, Zap } from "lucide-react";

export const categoryIcons: Record<string, typeof Bot> = {
  Robotics: Bot,
  IoT: Wifi,
  Networking: Network,
  Mechatronics: Cpu,
  Power: Zap,
};

export const allProjects = [
  { 
    id: "line-follower", 
    name: "Line-Follower Bot", 
    time: "2d ago", 
    cost: 3387.2, 
    tag: "Robotics",
    items: [
      { name: "Arduino Nano", qty: 1, unitPrice: 516.2 },
      { name: "IR Reflectance Array", qty: 1, unitPrice: 725.0 },
      { name: "TB6612FNG Motor Driver", qty: 1, unitPrice: 275.5 },
      { name: "Micro Gear Motor", qty: 2, unitPrice: 185.6 },
    ]
  },
  { 
    id: "power-electronics", 
    name: "Power Electronics", 
    time: "3d ago", 
    cost: 2450.0, 
    tag: "Power",
    items: [
      { name: "24V Power Supply", qty: 1, unitPrice: 1500.0 },
      { name: "LM2596 Buck IC", qty: 1, unitPrice: 250.0 },
      { name: "High Power LED Array", qty: 1, unitPrice: 700.0 },
    ]
  },
  { 
    id: "esp32-weather-node", 
    name: "ESP32 Weather Node", 
    time: "1d ago", 
    cost: 1200.0, 
    tag: "IoT",
    items: [
      { name: "ESP32 Dev Module", qty: 1, unitPrice: 400.0 },
      { name: "BME280 Sensor", qty: 1, unitPrice: 300.0 },
      { name: "0.96\" OLED Display", qty: 1, unitPrice: 500.0 },
    ]
  },
];
