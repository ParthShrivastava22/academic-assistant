import mongoose, {
  Schema,
  model,
  models,
  type Document as MongoDocument,
} from "mongoose";

export type PaperStatus = "processing" | "ready" | "error";

export interface IPaper extends MongoDocument {
  // Ownership & organization
  projectId: mongoose.Types.ObjectId;
  clerkUserId: string;

  // Paper metadata — used for LLM citations in Phase 2
  title: string;
  authors: string[];

  // Storage
  fileUrl: string;

  // Processing state
  status: PaperStatus;
  chunkCount?: number; // populated after ingestion completes

  createdAt: Date;
  updatedAt: Date;
}

const PaperSchema = new Schema<IPaper>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    clerkUserId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Paper title is required"],
      trim: true,
      maxlength: [300, "Title cannot exceed 300 characters"],
    },
    authors: {
      type: [String],
      default: [],
      // e.g. ["Vaswani, A.", "Shazeer, N."] — used for LLM prompt citations
    },
    fileUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["processing", "ready", "error"],
      default: "processing",
    },
    chunkCount: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index — most common query pattern:
// "give me all papers for project X belonging to user Y"
PaperSchema.index({ projectId: 1, clerkUserId: 1 });

export const PaperModel = models.Paper ?? model<IPaper>("Paper", PaperSchema);
