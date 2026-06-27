"use client";

import { useState, useEffect } from "react";
import {
  calculateProjectCost,
  ProjectCartSummary,
} from "@/lib/project-calculator";
import { ProjectDefinition } from "@/lib/project/types";

export function ProjectCost({
  project,
  className = "",
}: {
  project: ProjectDefinition | ProjectModel | ProjectCartSummary;
  className?: string;
}) {
  const [cost, setCost] = useState<number | null>(null);

  useEffect(() => {
    if ("totalPrice" in project) {
      setCost(project.totalPrice);
      return;
    } else {
      calculateProjectCost(project)
        .then(setCost)
        .catch(() => setCost(0));
    }
  }, [project]);

  return (
    <span className={className}>
      {cost !== null ? `₱${cost.toFixed(2)}` : "Calculating..."}
    </span>
  );
}
