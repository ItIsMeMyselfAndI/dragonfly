import mongoose, { Schema } from "mongoose";

const ProjectReportSchema = new Schema(
  {
    _id: { type: String, required: true },
    project_id: { type: String, required: true },
    report_name: { type: String },
    report_data: { type: Schema.Types.Mixed },
    pdf_url: { type: String },
    created_at: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false, versionKey: false },
);

ProjectReportSchema.index({ project_id: 1 });

export type ProjectReportDocument = mongoose.InferSchemaType<
  typeof ProjectReportSchema
>;

export const ProjectReportModel =
  (mongoose.models.ProjectReport as mongoose.Model<ProjectReportDocument>) ||
  mongoose.model<ProjectReportDocument>("ProjectReport", ProjectReportSchema);
