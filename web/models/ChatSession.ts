import mongoose, {
  Schema,
  model,
  models,
  type Document as MongoDocument,
} from "mongoose";

export type MessageRole = "user" | "assistant";

export interface IMessage {
  role: MessageRole;
  content: string;
  // Which papers were cited as sources for this response
  // Populated by the RAG pipeline in Phase 2
  citations: {
    paperId: mongoose.Types.ObjectId;
    paperTitle: string;
    authors: string[];
    page: number | null;
    excerpt: string; // short snippet from the chunk
  }[];
  createdAt: Date;
}

export interface IChatSession extends MongoDocument {
  projectId: mongoose.Types.ObjectId;
  clerkUserId: string;
  title: string; // auto-generated from first user message
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    citations: [
      {
        paperId: {
          type: Schema.Types.ObjectId,
          ref: "Paper",
        },
        paperTitle: String,
        authors: [String],
        page: { type: Number, default: null },
        excerpt: String,
      },
    ],
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    _id: false, // messages don't need their own ObjectId
  },
);

const ChatSessionSchema = new Schema<IChatSession>(
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
      default: "New conversation",
      maxlength: 200,
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export const ChatSessionModel =
  models.ChatSession ?? model<IChatSession>("ChatSession", ChatSessionSchema);
