"use client";
import { Handle, Position } from "reactflow";

export interface ComponentNode {
  id: string;
  label: string;
  type: string;
  shortDesc: string;
  position: { x: number; y: number };
}

const categoryColor: Record<string, string> = {
  mcu: "bg-primary/20 text-primary ring-primary/40",
  sensor: "bg-accent/20 text-accent ring-accent/40",
  actuator: "bg-warning/20 text-warning ring-warning/40",
  logic: "bg-white/10 text-foreground ring-white/20",
  power: "bg-destructive/15 text-destructive ring-destructive/30",
  passive: "bg-white/5 text-muted-foreground ring-white/10",
};

export const CustomNode = ({
  data,
}: {
  data: { component: ComponentNode; onClick: (c: ComponentNode) => void };
}) => (
  <button
    onClick={() => data.onClick(data.component)}
    className="flex w-48 relative flex-col items-center gap-1 rounded-2xl border bg-surface-elevated px-4 py-3 text-center border-white/10"
  >
    <Handle
      id="top"
      type="target"
      position={Position.Top}
      className="w-2 h-2 border-none bg-muted-foreground/50"
    />

    <Handle
      id="bottom"
      type="source"
      position={Position.Bottom}
      className="w-2 h-2 border-none bg-muted-foreground/50"
    />

    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${
        categoryColor[data.component.type.toLowerCase()] ||
        "bg-white/5 text-muted-foreground ring-white/10"
      }`}
    >
      {data.component.type.toUpperCase()}
    </span>
    <p className="text-sm font-medium">{data.component.label}</p>
    <p className="text-[10px] text-muted-foreground">
      {data.component.shortDesc}
    </p>
  </button>
);
