import { supabase } from "@/lib/supabase/client";
import {
  ProjectModel,
  ProjectNodeModel,
  ProjectEdgeModel,
  ProjectSubstituteModel,
  ProjectComponentModel,
  ProjectSpecsReportModel,
} from "../types";

export async function getAllProjects(): Promise<ProjectModel[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("time", { ascending: false });

  if (error) throw new Error(`Error fetching projects: ${error.message}`);

  // Map snake_case from DB to camelCase for Frontend
  return (data || []).map((item) => ({
    id: item.id,
    name: item.name,
    time: item.time,
    tag: item.tag,
  }));
}

export async function getProjectById(
  id: string,
): Promise<ProjectModel | undefined> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return undefined;
    throw new Error(`Error fetching project: ${error.message}`);
  }

  return {
    id: data.id,
    name: data.name,
    time: data.time,
    tag: data.tag,
  };
}

export async function createProject(
  project: ProjectModel,
): Promise<ProjectModel> {
  const { data, error } = await supabase
    .from("projects")
    .insert([project])
    .select()
    .single();

  if (error) throw new Error(`Error creating project: ${error.message}`);
  return data;
}

export async function updateProject(
  id: string,
  updated: Partial<ProjectModel>,
): Promise<ProjectModel | undefined> {
  const { data, error } = await supabase
    .from("projects")
    .update(updated)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Error updating project: ${error.message}`);
  return data;
}

export async function deleteProject(id: string): Promise<boolean> {
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) throw new Error(`Error deleting project: ${error.message}`);
  return true;
}

export async function createNodesBatch(
  nodes: ProjectNodeModel[],
): Promise<ProjectNodeModel[]> {
  const { data, error } = await supabase
    .from("project_nodes")
    .insert(
      nodes.map((node) => ({
        id: node.id,
        project_id: node.projectId,
        component_id: node.componentId,
        position_x: node.positionX,
        position_y: node.positionY,
      })),
    )
    .select();

  if (error) throw new Error(`Error creating nodes batch: ${error.message}`);
  return data.map((d) => ({
    id: d.id,
    projectId: d.project_id,
    componentId: d.component_id,
    positionX: d.position_x,
    positionY: d.position_y,
  }));
}

export async function createEdgesBatch(
  edges: ProjectEdgeModel[],
): Promise<ProjectEdgeModel[]> {
  const { data, error } = await supabase
    .from("project_edges")
    .insert(
      edges.map((edge) => ({
        id: edge.id,
        project_id: edge.projectId,
        source_id: edge.sourceId,
        target_id: edge.targetId,
        source_handle: edge.sourceHandle,
        target_handle: edge.targetHandle,
        label: edge.label,
        type: edge.type,
      })),
    )
    .select();

  if (error) throw new Error(`Error creating edges batch: ${error.message}`);
  return data.map((d) => ({
    id: d.id,
    projectId: d.project_id,
    sourceId: d.source_id,
    targetId: d.target_id,
    sourceHandle: d.source_handle,
    targetHandle: d.target_handle,
    label: d.label,
    type: d.type,
  }));
}

export async function createComponentsBatch(
  components: ProjectComponentModel[],
): Promise<ProjectComponentModel[]> {
  const { data, error } = await supabase
    .from("project_components")
    .insert(
      components.map((comp) => ({
        id: comp.id,
        project_id: comp.projectId,
        inventory_id: comp.inventoryId,
        name: comp.name,
        part_number: comp.partNumber,
        shortDesc: comp.shortDesc,
        unit_price: comp.unitPrice,
        qty: comp.qty,
        category: comp.category,
        pins: comp.pins,
        details: comp.details,
      })),
    )
    .select("project_id");

  if (error)
    throw new Error(`Error creating components batch: ${error.message}`);

  // Fetch updated data to include dynamic stock info from JOIN
  return await getComponentsByProjectId(data[0].project_id);
}

export async function getNodesByProjectId(
  projectId: string,
): Promise<ProjectNodeModel[]> {
  const { data, error } = await supabase
    .from("project_nodes")
    .select("*")
    .eq("project_id", projectId);

  if (error) throw new Error(`Error fetching nodes: ${error.message}`);

  return (data || []).map((item) => ({
    id: item.id,
    projectId: item.project_id,
    componentId: item.component_id,
    positionX: item.position_x,
    positionY: item.position_y,
  }));
}

export async function createNode(
  node: ProjectNodeModel,
  projectId: string,
): Promise<ProjectNodeModel> {
  const { data, error } = await supabase
    .from("project_nodes")
    .insert([
      {
        id: node.id,
        project_id: projectId,
        component_id: node.componentId,
        position_x: node.positionX,
        position_y: node.positionY,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(`Error creating node: ${error.message}`);

  return {
    id: data.id,
    projectId: data.project_id,
    componentId: data.component_id,
    positionX: data.position_x,
    positionY: data.position_y,
  };
}

export async function updateNode(
  id: string,
  updated: Partial<ProjectNodeModel>,
): Promise<ProjectNodeModel | undefined> {
  // Map camelCase to snake_case
  const updatePayload: any = {};
  if ("projectId" in updated) updatePayload.project_id = updated.projectId;
  if ("componentId" in updated)
    updatePayload.component_id = updated.componentId;
  if ("positionX" in updated) updatePayload.position_x = updated.positionX;
  if ("positionY" in updated) updatePayload.position_y = updated.positionY;

  const { data, error } = await supabase
    .from("project_nodes")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Error updating node: ${error.message}`);
  return data
    ? {
        id: data.id,
        projectId: data.project_id,
        componentId: data.component_id,
        positionX: data.position_x,
        positionY: data.position_y,
      }
    : undefined;
}

export async function deleteNode(id: string): Promise<boolean> {
  const { error } = await supabase.from("project_nodes").delete().eq("id", id);

  if (error) throw new Error(`Error deleting node: ${error.message}`);
  return true;
}

// --- Edges ---

export async function getEdgesByProjectId(
  projectId: string,
): Promise<ProjectEdgeModel[]> {
  const { data, error } = await supabase
    .from("project_edges")
    .select("*")
    .eq("project_id", projectId);

  if (error) throw new Error(`Error fetching edges: ${error.message}`);

  return (data || []).map((item) => ({
    id: item.id,
    projectId: item.project_id,
    sourceId: item.source_id,
    targetId: item.target_id,
    sourceHandle: item.source_handle,
    targetHandle: item.target_handle,
    label: item.label,
    type: item.type,
  }));
}

export async function createEdge(
  edge: ProjectEdgeModel,
  projectId: string,
): Promise<ProjectEdgeModel> {
  const { data, error } = await supabase
    .from("project_edges")
    .insert([
      {
        id: edge.id,
        project_id: projectId,
        source_id: edge.sourceId,
        target_id: edge.targetId,
        source_handle: edge.sourceHandle,
        target_handle: edge.targetHandle,
        label: edge.label,
        type: edge.type,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(`Error creating edge: ${error.message}`);

  return {
    id: data.id,
    projectId: data.project_id,
    sourceId: data.source_id,
    targetId: data.target_id,
    sourceHandle: data.source_handle,
    targetHandle: data.target_handle,
    label: data.label,
    type: data.type,
  };
}

export async function updateEdge(
  id: string,
  updated: Partial<ProjectEdgeModel>,
): Promise<ProjectEdgeModel | undefined> {
  const updatePayload: any = {};
  if ("projectId" in updated) updatePayload.project_id = updated.projectId;
  if ("sourceId" in updated) updatePayload.source_id = updated.sourceId;
  if ("targetId" in updated) updatePayload.target_id = updated.targetId;
  if ("sourceHandle" in updated)
    updatePayload.source_handle = updated.sourceHandle;
  if ("targetHandle" in updated)
    updatePayload.target_handle = updated.targetHandle;
  if ("label" in updated) updatePayload.label = updated.label;
  if ("type" in updated) updatePayload.type = updated.type;

  const { data, error } = await supabase
    .from("project_edges")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Error updating edge: ${error.message}`);
  return data
    ? {
        id: data.id,
        projectId: data.project_id,
        sourceId: data.source_id,
        targetId: data.target_id,
        targetHandle: data.target_handle,
        sourceHandle: data.source_handle,
        label: data.label,
        type: data.type,
      }
    : undefined;
}

export async function deleteEdge(id: string): Promise<boolean> {
  const { error } = await supabase.from("project_edges").delete().eq("id", id);

  if (error) throw new Error(`Error deleting edge: ${error.message}`);
  return true;
}

// --- Substitutes ---

export async function getSubstitutesByProjectId(
  projectId: string,
): Promise<ProjectSubstituteModel[]> {
  const { data, error } = await supabase
    .from("project_substitutes")
    .select("*")
    .eq("project_id", projectId);

  if (error) throw new Error(`Error fetching substitutes: ${error.message}`);

  return (data || []).map((item) => ({
    id: item.id,
    projectId: item.project_id,
    originalComponentId: item.original_component_id,
    substituteComponentId: item.substitute_component_id,
  }));
}

export async function createSubstitute(
  substitute: ProjectSubstituteModel,
): Promise<ProjectSubstituteModel> {
  const { data, error } = await supabase
    .from("project_substitutes")
    .insert([
      {
        id: substitute.id,
        project_id: substitute.projectId,
        original_component_id: substitute.originalComponentId,
        substitute_component_id: substitute.substituteComponentId,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(`Error creating substitute: ${error.message}`);

  return {
    id: data.id,
    projectId: data.project_id,
    originalComponentId: data.original_component_id,
    substituteComponentId: data.substitute_component_id,
  };
}

// --- Specs Reports ---

export async function getReportByProjectId(
  projectId: string,
): Promise<ProjectSpecsReportModel | undefined> {
  const { data, error } = await supabase
    .from("project_specs_reports")
    .select("*")
    .eq("project_id", projectId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return undefined;
    throw new Error(`Error fetching report: ${error.message}`);
  }

  return {
    id: data.id,
    projectId: data.project_id,
    url: data.url,
  };
}

export async function createReport(
  report: ProjectSpecsReportModel,
): Promise<ProjectSpecsReportModel> {
  const { data, error } = await supabase
    .from("project_specs_reports")
    .insert([report])
    .select()
    .single();

  if (error) throw new Error(`Error creating report: ${error.message}`);

  return {
    id: data.id,
    projectId: data.project_id,
    url: data.url,
  };
}

export async function updateReport(
  id: string,
  updated: Partial<ProjectSpecsReportModel>,
): Promise<ProjectSpecsReportModel | undefined> {
  const { data, error } = await supabase
    .from("project_specs_reports")
    .update(updated)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Error updating report: ${error.message}`);

  return {
    id: data.id,
    projectId: data.project_id,
    url: data.url,
  };
}

export async function deleteReport(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("project_specs_reports")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Error deleting report: ${error.message}`);
  return true;
}

// --- Components ---

export async function getComponentsByProjectId(
  projectId: string,
): Promise<ProjectComponentModel[]> {
  const { data, error } = await supabase
    .from("project_components")
    .select("*, inventory(stock, stock_count)")
    .eq("project_id", projectId);

  if (error) throw new Error(`Error fetching components: ${error.message}`);

  return (data || []).map((item: any) => {
    // Access joined inventory data
    const inv = Array.isArray(item.inventory)
      ? item.inventory[0]
      : item.inventory;
    return {
      id: item.id,
      projectId: item.project_id,
      inventoryId: item.inventory_id,
      name: item.name,
      partNumber: item.part_number,
      shortDesc: item.shortDesc,
      unitPrice: item.unit_price,
      qty: item.qty,
      stock: inv?.stock || "OUT",
      stockCount: inv?.stock_count || 0,
      category: item.category,
      pins: item.pins,
      details: item.details,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  });
}

export async function createComponent(
  component: ProjectComponentModel,
): Promise<ProjectComponentModel> {
  const { data, error } = await supabase
    .from("project_components")
    .insert([
      {
        id: component.id,
        project_id: component.projectId,
        inventory_id: component.inventoryId,
        name: component.name,
        part_number: component.partNumber,
        shortDesc: component.shortDesc,
        unit_price: component.unitPrice,
        qty: component.qty,
        category: component.category,
        pins: component.pins,
        details: component.details,
      },
    ])
    .select("project_id")
    .single();

  if (error) throw new Error(`Error creating component: ${error.message}`);

  // Fetch updated data to include dynamic stock info from JOIN
  const components = await getComponentsByProjectId(data.project_id);
  return components.find((c) => c.id === component.id)!;
}

export async function updateComponent(
  id: string,
  updated: Partial<ProjectComponentModel>,
): Promise<ProjectComponentModel | undefined> {
  const updatePayload: Record<string, any> = {};
  if ("projectId" in updated) updatePayload.project_id = updated.projectId;
  if ("inventoryId" in updated)
    updatePayload.inventory_id = updated.inventoryId;
  if ("name" in updated) updatePayload.name = updated.name;
  if ("partNumber" in updated) updatePayload.part_number = updated.partNumber;
  if ("shortDesc" in updated) updatePayload.shortDesc = updated.shortDesc;
  if ("unitPrice" in updated) updatePayload.unit_price = updated.unitPrice;
  if ("qty" in updated) updatePayload.qty = updated.qty;
  if ("category" in updated) updatePayload.category = updated.category;
  if ("pins" in updated) updatePayload.pins = updated.pins;
  if ("details" in updated) updatePayload.details = updated.details;

  const { data, error } = await supabase
    .from("project_components")
    .update(updatePayload)
    .eq("id", id)
    .select("project_id")
    .single();

  if (error) throw new Error(`Error updating component: ${error.message}`);

  // Fetch updated data to include dynamic stock info from JOIN
  const components = await getComponentsByProjectId(data.project_id);
  return components.find((c) => c.id === id);
}

export async function deleteComponent(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("project_components")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Error deleting component: ${error.message}`);
  return true;
}
