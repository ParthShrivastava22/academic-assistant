import {
  Schema,
  model,
  models,
  type Document as MongoDocument,
} from "mongoose";

export interface IProject extends MongoDocument {
  title: string;
  description?: string;
  clerkUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    clerkUserId: {
      type: String,
      required: true,
      index: true, // queried on every dashboard load
    },
  },
  {
    timestamps: true,
  },
);

export const ProjectModel =
  models.Project ?? model<IProject>("Project", ProjectSchema);
