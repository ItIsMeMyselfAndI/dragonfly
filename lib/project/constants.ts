import {
  Bot,
  Wifi,
  Network,
  Cpu,
  Zap,
  type LucideIcon,
  HelpCircle,
} from "lucide-react";
import {
  ConnectionEnum,
  ProjectTag,
  ProjectTagType,
  type ConnectionType,
} from "./types";

export const categoryIcons: Record<ProjectTagType, LucideIcon> = {
  [ProjectTag.ROBOTICS]: Bot,
  [ProjectTag.IOT]: Wifi,
  [ProjectTag.NETWORKING]: Network,
  [ProjectTag.MECHATRONICS]: Cpu,
  [ProjectTag.POWER]: Zap,
  [ProjectTag.NA]: HelpCircle,
};

export const edgeColors: Record<ConnectionType, string> = {
  [ConnectionEnum.POWER]: "#ef4444",
  [ConnectionEnum.SIGNAL]: "#3b82f6",
  [ConnectionEnum.LOGIC]: "#8b5cf6",
  [ConnectionEnum.I2C]: "#10b981",
};
