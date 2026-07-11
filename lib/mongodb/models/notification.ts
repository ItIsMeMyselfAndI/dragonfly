import mongoose, { Schema } from "mongoose";
import {
  NOTIFICATION_ACTION_TYPES,
  NOTIFICATION_ACTION_STYLES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_RECIPIENT_KINDS,
  NOTIFICATION_SEVERITIES,
} from "@/lib/apis/notification/types";

const NotificationActionSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    style: {
      type: String,
      enum: Object.values(NOTIFICATION_ACTION_STYLES),
      default: "primary",
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_ACTION_TYPES),
      required: true,
    },
    path: { type: String },
    url: { type: String },
    endpoint: { type: String },
    method: { type: String, enum: ["GET", "POST", "PUT", "DELETE"] },
    payload: { type: Schema.Types.Mixed },
    dismissOnClick: { type: Boolean, default: true },
  },
  { _id: false },
);

const NotificationActionStateSchema = new Schema(
  {
    value: { type: Boolean, default: false },
    at: { type: Date, default: null },
    permanent: { type: Boolean, default: false },
  },
  { _id: false },
);

function defaultActionStates() {
  const base = { value: false, at: null, permanent: false };
  return {
    read: { ...base },
    dismiss: { ...base },
    delete: { ...base },
    expand: { ...base },
    redirect: { ...base },
    external_link: { ...base },
    callback: { ...base },
  };
}

const NotificationActionStatesSchema = new Schema(
  {
    read: { type: NotificationActionStateSchema, default: () => ({ ...defaultActionStates().read }) },
    dismiss: { type: NotificationActionStateSchema, default: () => ({ ...defaultActionStates().dismiss }) },
    delete: { type: NotificationActionStateSchema, default: () => ({ ...defaultActionStates().delete }) },
    expand: { type: NotificationActionStateSchema, default: () => ({ ...defaultActionStates().expand }) },
    redirect: { type: NotificationActionStateSchema, default: () => ({ ...defaultActionStates().redirect }) },
    external_link: { type: NotificationActionStateSchema, default: () => ({ ...defaultActionStates().external_link }) },
    callback: { type: NotificationActionStateSchema, default: () => ({ ...defaultActionStates().callback }) },
  },
  { _id: false },
);

const NotificationSchema = new Schema(
  {
    _id: { type: String, required: true },
    recipientId: { type: String, required: true, index: true },
    recipientKind: {
      type: String,
      enum: Object.values(NOTIFICATION_RECIPIENT_KINDS),
      required: true,
    },
    category: {
      type: String,
      enum: Object.values(NOTIFICATION_CATEGORIES),
      required: true,
    },
    severity: {
      type: String,
      enum: Object.values(NOTIFICATION_SEVERITIES),
      default: "info",
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    icon: { type: String },
    details: { type: String },
    actionButtons: { type: [NotificationActionSchema], default: [] },
    actions: {
      type: NotificationActionStatesSchema,
      default: defaultActionStates,
    },
    expiresAt: { type: Date, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false, versionKey: false, timestamps: true },
);

NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, "actions.read.value": 1 });
NotificationSchema.index({
  recipientId: 1,
  "actions.delete.value": 1,
  "actions.delete.permanent": 1,
});
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type NotificationDocument = mongoose.InferSchemaType<
  typeof NotificationSchema
>;

export const NotificationModel =
  (mongoose.models.Notification as mongoose.Model<NotificationDocument>) ||
  mongoose.model<NotificationDocument>("Notification", NotificationSchema);
