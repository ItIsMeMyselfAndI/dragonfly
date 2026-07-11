import mongoose, { Schema } from "mongoose";
import { ProjectTagEnum, ConnectionEnum } from "@/lib/apis/project/types";

const ProjectComponentSchema = new Schema(
  {
    id: { type: String, required: true },
    inventoryId: { type: String, required: true },
    qty: { type: Number, required: true, default: 1 },
    createdAt: { type: String },
    updatedAt: { type: String },
  },
  { _id: false },
);

const ProjectNodeSchema = new Schema(
  {
    id: { type: String, required: true },
    componentId: { type: String, required: true },
    positionX: { type: Number, required: true },
    positionY: { type: Number, required: true },
  },
  { _id: false },
);

const ProjectEdgeSchema = new Schema(
  {
    id: { type: String, required: true },
    sourceId: { type: String, required: true },
    targetId: { type: String, required: true },
    sourceHandle: {
      type: String,
      enum: ["top", "bottom", "left", "right"],
    },
    targetHandle: {
      type: String,
      enum: ["top", "bottom", "left", "right"],
    },
    label: { type: String },
    type: { type: String, enum: Object.values(ConnectionEnum) },
  },
  { _id: false },
);

const ProjectSubstituteSchema = new Schema(
  {
    id: { type: String, required: true },
    originalComponentId: { type: String, required: true },
    substituteComponentId: { type: String, required: true },
  },
  { _id: false },
);

const ProjectSpecsReportSchema = new Schema(
  {
    id: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false },
);

const ProjectSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    time: { type: String, required: true },
    tag: { type: String, enum: Object.values(ProjectTagEnum), required: true },
    components: { type: [ProjectComponentSchema], default: [] },
    nodes: { type: [ProjectNodeSchema], default: [] },
    edges: { type: [ProjectEdgeSchema], default: [] },
    substitutes: { type: [ProjectSubstituteSchema], default: [] },
    specsReport: { type: ProjectSpecsReportSchema, default: null },
  },
  { _id: false, versionKey: false },
);

ProjectSchema.index({ tag: 1 });
ProjectSchema.index({ "components.inventoryId": 1 });

export type ProjectDocument = mongoose.InferSchemaType<typeof ProjectSchema>;

export const ProjectModel =
  (mongoose.models.Project as mongoose.Model<ProjectDocument>) ||
  mongoose.model<ProjectDocument>("Project", ProjectSchema);
