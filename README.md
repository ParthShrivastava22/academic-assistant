# ScholarAI — Complete Technical Documentation
### A Literature Review Copilot for Researchers

---

> **How to use this document:** Read it top to bottom once. Then use it as a reference before interviews. Every section answers the question *"How would you explain this?"* — not just *"what does it do"* but *"why was it built this way."*

---

## Table of Contents

1. [What ScholarAI Is](#1-what-scholarai-is)
2. [The Big Picture Architecture](#2-the-big-picture-architecture)
3. [The Tech Stack — Every Choice Explained](#3-the-tech-stack--every-choice-explained)
4. [Next.js — The Complete Explanation](#4-nextjs--the-complete-explanation)
5. [Clerk Authentication — How It Works](#5-clerk-authentication--how-it-works)
6. [UploadThing — How File Uploads Work](#6-uploadthing--how-file-uploads-work)
7. [MongoDB and Mongoose — The Database Layer](#7-mongodb-and-mongoose--the-database-layer)
8. [The RAG Pipeline — The AI Brain](#8-the-rag-pipeline--the-ai-brain)
9. [FastAPI — The Python Server](#9-fastapi--the-python-server)
10. [Ollama — The Local LLM](#10-ollama--the-local-llm)
11. [Every Page Explained](#11-every-page-explained)
12. [Every Component Explained](#12-every-component-explained)
13. [Every API Route Explained](#13-every-api-route-explained)
14. [React Hooks — Every One Used](#14-react-hooks--every-one-used)
15. [Data Flow — Tracing Every Feature End to End](#15-data-flow--tracing-every-feature-end-to-end)
16. [The Database Schema Design — Why It's Structured This Way](#16-the-database-schema-design--why-its-structured-this-way)
17. [Security — How Every Layer Is Protected](#17-security--how-every-layer-is-protected)
18. [Common Interview Questions and Model Answers](#18-common-interview-questions-and-model-answers)

---

## 1. What ScholarAI Is

ScholarAI is a **Literature Review Copilot** — a web application that helps researchers synthesize findings across multiple academic papers using AI.

### The Problem It Solves

A researcher doing a literature review might read 10-20 papers. They need to:
- Identify common themes across papers
- Compare methodologies between papers
- Find contradictions between different studies
- Cite specific papers when making claims

Doing this manually takes weeks. ScholarAI lets a researcher upload 5-10 papers, then ask questions like *"How do BERT and GPT-3 differ in their training approach?"* and get an answer that cites the specific paper and page number.

### What It Is NOT

- It is not a general-purpose chatbot like ChatGPT
- It only answers from the papers you uploaded — it will not use outside knowledge
- It is not a paper summarizer — it does synthesis and comparison across papers

### The Core Concept: RAG

The entire AI system is built on a technique called **Retrieval-Augmented Generation (RAG)**:

```
User asks a question
        ↓
System searches the uploaded papers for relevant sections
        ↓
Those sections are given to the AI as context
        ↓
AI generates an answer based ONLY on those sections
        ↓
Answer includes citations back to source papers
```

This is fundamentally different from asking an LLM a question directly. The LLM is essentially reading the relevant parts of the papers before answering.

---

## 2. The Big Picture Architecture

ScholarAI is split into two completely separate servers that talk to each other:

```
┌─────────────────────────────────────────────────────────┐
│  USER'S BROWSER                                         │
│  React UI (Next.js)                                     │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP requests
                       ▼
┌─────────────────────────────────────────────────────────┐
│  SERVER 1: Next.js (Port 3000)                          │
│  - Serves all web pages                                 │
│  - Handles authentication via Clerk                     │
│  - Manages database (MongoDB)                           │
│  - Talks to UploadThing for file storage                │
│  - Talks to FastAPI for AI operations                   │
└──────────────────────┬──────────────────────────────────┘
                       │ Internal HTTP (shared secret)
                       ▼
┌─────────────────────────────────────────────────────────┐
│  SERVER 2: FastAPI (Port 8000)                          │
│  - Processes PDFs into chunks                           │
│  - Creates vector embeddings                            │
│  - Manages FAISS vector database                        │
│  - Queries for relevant chunks                          │
│  - Calls back to Next.js when done                      │
└─────────────────────────────────────────────────────────┘
                       │ runs on
                       ▼
┌─────────────────────────────────────────────────────────┐
│  LOCAL MACHINE                                          │
│  - Ollama (LLM server, Port 11434)                      │
│  - FAISS indexes (saved to disk)                        │
│  - HuggingFace embedding model (cached)                 │
└─────────────────────────────────────────────────────────┘
```

### External Services Used

```
Clerk          → Authentication (who is the user?)
UploadThing    → File storage (where are the PDFs stored?)
MongoDB Atlas  → Database (what metadata do we store?)
```

### Why Two Servers?

The Python ecosystem has far better AI/ML libraries than JavaScript. LangChain, FAISS, HuggingFace, and sentence-transformers are all Python-native. Rather than trying to run Python code from Node.js, we run a separate Python server (FastAPI) that handles all AI operations, and the Next.js server calls it over HTTP when needed.

---

## 3. The Tech Stack — Every Choice Explained

### Next.js (Web Framework)
**What:** A framework built on top of React that adds server-side capabilities.  
**Why:** It lets us write both the frontend (what users see) and backend (API routes) in one codebase using TypeScript. The App Router architecture (used here) is the modern way to build Next.js apps.  
**Alternative:** Could have used Express.js for the backend and plain React for the frontend, but Next.js combines them cleanly.

### TypeScript
**What:** JavaScript with type annotations.  
**Why:** Catches bugs before they happen. If you define that a function expects a `string` and you pass a `number`, TypeScript tells you immediately instead of crashing at runtime. Critical for a project this size.

### Tailwind CSS
**What:** A CSS framework where you style things using small utility classes directly in HTML/JSX.  
**Why:** Instead of writing separate CSS files, you write `className="flex items-center gap-2 text-sm font-medium"` directly on the element. Faster development, no naming CSS classes, no context switching.  
**Example:** `bg-primary text-primary-foreground rounded-lg px-4 py-2` = a styled button without writing any CSS.

### Shadcn UI
**What:** A collection of pre-built, accessible React components (Button, Card, Dialog, etc.).  
**Why:** Instead of building a button from scratch, you use `<Button variant="outline" size="sm">`. Shadcn components are installed directly into your codebase (not a package dependency) so you own the code and can customize freely.  
**Important:** Shadcn is NOT a component library you install from npm. It copies component source code into your `src/components/ui/` folder. This is why `Button`, `Card`, etc. are in your project files.

### Clerk
**What:** A complete authentication service.  
**Why:** Building authentication from scratch (login, signup, password reset, session management, security) takes weeks. Clerk handles all of it. You just wrap your app in `<ClerkProvider>` and use hooks like `useAuth()`.

### UploadThing
**What:** A file upload service specifically designed for Next.js.  
**Why:** Uploading files to a server involves many edge cases (file size limits, progress tracking, storage, CDN delivery). UploadThing handles storage and CDN, and provides a React component (`<UploadDropzone>`) that handles the entire upload UI.

### MongoDB + Mongoose
**What:** MongoDB is a NoSQL database. Mongoose is a library that adds structure (schemas) to MongoDB from Node.js.  
**Why:** MongoDB stores data as JSON-like documents, which maps naturally to JavaScript objects. Good for a project with a flexible, evolving schema. Mongoose adds validation and type safety on top.

### FastAPI
**What:** A modern Python web framework for building APIs.  
**Why:** Python has the best AI/ML ecosystem. FastAPI is fast, has automatic API documentation, and has excellent support for background tasks (which we use for ingestion).

### FAISS
**What:** Facebook AI Similarity Search — an in-memory vector database.  
**Why:** After converting text to vectors (arrays of numbers), FAISS can find the most similar vectors to a query vector extremely fast. We use it to find which chunks of text are most relevant to a user's question.  
**Alternative:** Pinecone (cloud vector database). We chose FAISS because it's free and runs locally.

### HuggingFace Sentence Transformers
**What:** A pre-trained AI model (`all-MiniLM-L6-v2`) that converts text into vectors (embeddings).  
**Why:** To search text semantically ("find text about neural networks" should match "deep learning" even though the words are different), you first convert all text to vectors, then find vectors that are mathematically close to each other.

### Ollama
**What:** A tool that runs open-source LLMs (Large Language Models) locally on your machine.  
**Why:** Running an LLM locally means no API costs, no data leaving your machine, no rate limits. We use `llama3.2` model through Ollama.

### LangChain
**What:** A Python library that provides standard interfaces for working with LLMs, document loaders, text splitters, and vector stores.  
**Why:** Standardizes the RAG pipeline. Instead of writing custom PDF parsing and chunking code, LangChain provides battle-tested implementations.

---

## 4. Next.js — The Complete Explanation

This is the most important section to understand because it governs how the entire web application works.

### What is Next.js?

Next.js is a React framework. React is a JavaScript library for building UIs. Next.js extends React with:
- **File-based routing** (the file structure determines the URL structure)
- **Server-side rendering** (pages can be generated on the server before being sent to the browser)
- **API routes** (backend endpoints in the same codebase)
- **Built-in optimizations** (image optimization, font loading, etc.)

### The App Router

We use Next.js's **App Router** (introduced in Next.js 13). This is different from the older Pages Router.

The file structure under `src/app/` directly maps to URLs:

```
src/app/
├── page.tsx                      → /
├── dashboard/
│   └── page.tsx                  → /dashboard
├── project/
│   └── [projectId]/
│       └── page.tsx              → /project/anything
├── sign-in/
│   └── [[...sign-in]]/
│       └── page.tsx              → /sign-in (and sub-paths)
└── api/
    ├── projects/
    │   └── route.ts              → /api/projects
    └── chat/
        └── route.ts              → /api/chat
```

The `[projectId]` in brackets means it's a **dynamic route** — the value in the URL becomes a parameter you can read in code.

### Server Components vs Client Components

This is the most important Next.js concept to understand.

**Server Components (default):**
- Run on the server only
- Never sent to the browser as JavaScript
- Can directly access databases, file systems, environment secrets
- Cannot use React hooks (`useState`, `useEffect`)
- Cannot handle browser events (`onClick`, `onChange`)
- Identified by: no `"use client"` at the top

**Client Components:**
- Run in the browser (and optionally also on the server for initial render)
- Can use all React hooks
- Can handle events
- Cannot directly access databases or secrets
- Identified by: `"use client"` at the very top of the file

**Example from ScholarAI:**

```typescript
// src/app/dashboard/page.tsx — SERVER COMPONENT
// No "use client" → runs on server
// Directly queries MongoDB:
export default async function DashboardPage() {
  const { userId } = await auth();          // reads session server-side
  const projects = await getUserProjects(userId); // queries MongoDB directly
  return <DashboardClient projects={projects} />; // passes data to client
}
```

```typescript
// src/components/dashboard-client.tsx — CLIENT COMPONENT
"use client"; // ← this is what makes it a client component

export function DashboardClient({ projects }) {
  const [search, setSearch] = useState(""); // can use hooks
  // handles search, upload dialog state, etc.
}
```

**Why split it this way?**

The server component fetches data (sensitive — needs DB access), then passes it as props to the client component (needs interactivity — search, dialogs). This is the recommended pattern in Next.js App Router.

### How API Routes Work

Files named `route.ts` inside `src/app/api/` become HTTP endpoints. They export functions named after HTTP methods:

```typescript
// src/app/api/projects/route.ts
export async function GET() { ... }    // handles GET /api/projects
export async function POST(req) { ... } // handles POST /api/projects
```

```typescript
// src/app/api/projects/[projectId]/route.ts
export async function GET(req, { params }) { ... }    // handles GET /api/projects/abc123
export async function DELETE(req, { params }) { ... } // handles DELETE /api/projects/abc123
```

### The `async/await` Pattern

Almost everything in Next.js is asynchronous — database calls, API calls, file operations. These operations take time and instead of blocking the entire server, JavaScript uses `async/await`:

```typescript
// This function is async — it returns a Promise
async function getProject(id: string) {
  await connectToDatabase();           // wait for DB connection
  const project = await Project.findById(id); // wait for DB query
  return project;
}
```

`await` means "wait for this to finish before continuing, but don't block other requests."

### `params` as a Promise (Next.js 15)

In Next.js 15, dynamic route parameters became Promises. This is why we always `await params`:

```typescript
// Next.js 15 — params is a Promise
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params; // must await before using
}
```

### Middleware

`src/middleware.ts` runs before every request. We use it to protect routes:

```typescript
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/project(.*)",
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect();
  // If not logged in and trying to access /dashboard → redirect to /sign-in
});
```

The `(.*)` means "and any sub-path." So `/dashboard/anything` is also protected.

### `router.refresh()`

When a user uploads a paper, we want the dashboard to show the new paper without a full page reload. `router.refresh()` re-runs the server component's data fetching while keeping React state intact in the client:

```typescript
const router = useRouter();

const handleUploadComplete = () => {
  router.refresh(); // re-fetches data from MongoDB, updates UI
};
```

### `notFound()` and `redirect()`

```typescript
import { notFound, redirect } from "next/navigation";

// If document doesn't exist → shows Next.js 404 page
if (!doc) notFound();

// If not logged in → sends to sign-in page
if (!userId) redirect("/sign-in");
```

### Dynamic Imports

Used for the PDF viewer because `pdf.js` requires browser APIs (`window`, `canvas`) that don't exist on the server:

```typescript
const PdfViewer = dynamic(
  () => import("@/components/pdf-viewer").then((m) => m.PdfViewer),
  {
    ssr: false,          // don't render on server
    loading: () => <div>Loading...</div>,
  }
);
```

`ssr: false` means this component is skipped during server rendering and only loaded in the browser.

### Environment Variables

Variables in `.env.local` are secret configuration. Next.js has two types:
- `NEXT_PUBLIC_` prefix → available in browser AND server
- No prefix → available on server ONLY (secret keys)

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...  ← safe to expose to browser
CLERK_SECRET_KEY=sk_...                    ← server only, never sent to browser
MONGODB_URI=mongodb+srv://...              ← server only
```

### The `@/` Import Alias

`@/` maps to `src/`. So `import { Button } from "@/components/ui/button"` means `src/components/ui/button`. Configured in `tsconfig.json`. Avoids ugly relative paths like `../../../components/ui/button`.

---

## 5. Clerk Authentication — How It Works

### What Clerk Does

Clerk is a complete authentication platform. It handles:
- User registration and login
- Password management and resets
- Session tokens (JWTs)
- OAuth (Google, GitHub, etc.)
- Security (rate limiting, bot detection)

### How It's Integrated

**Step 1 — Wrap the entire app:**
```typescript
// src/app/layout.tsx
<ClerkProvider afterSignOutUrl="/">
  {children}
</ClerkProvider>
```
This makes auth state available everywhere in the app.

**Step 2 — Protect routes in middleware:**
```typescript
// src/middleware.ts
clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect();
});
```
Before any request reaches a protected page, Clerk checks if the user has a valid session. If not, redirects to `/sign-in`.

**Step 3 — Get the user in server components/API routes:**
```typescript
import { auth } from "@clerk/nextjs/server";

const { userId } = await auth();
if (!userId) return redirect("/sign-in");
```
`auth()` reads the session cookie and returns the user's Clerk ID. We use this ID as the key to find that user's data in MongoDB.

**Step 4 — Show auth UI:**
```typescript
import { UserButton } from "@clerk/nextjs";
<UserButton /> // Shows avatar + dropdown with sign out
```

```typescript
import { SignIn } from "@clerk/nextjs";
<SignIn /> // Full sign-in form, Clerk-hosted
```

### The Session Flow

```
User fills in sign-in form (Clerk handles this)
        ↓
Clerk validates credentials
        ↓
Clerk sets a secure HTTP-only cookie with a session token (JWT)
        ↓
Every subsequent request includes this cookie automatically
        ↓
Server calls auth() → reads cookie → returns userId
        ↓
We use userId to query only that user's data from MongoDB
```

### Why We Store `clerkUserId` in MongoDB

Clerk manages users. MongoDB manages app data. They're connected through the `clerkUserId` field:

```typescript
// When creating a project:
await ProjectModel.create({
  title: "My Research",
  clerkUserId: userId, // this comes from Clerk's auth()
});

// When fetching projects:
await ProjectModel.find({ clerkUserId: userId }); // only this user's projects
```

This means even if someone somehow got another user's project ID, our API would still not return the data because the `clerkUserId` check would fail.

### The `[[...sign-in]]` Folder Name

The double brackets `[[...]]` create a **catch-all optional route**. Clerk needs to handle `/sign-in`, `/sign-in/factor-one`, `/sign-in/sso-callback`, and many other paths. The catch-all folder handles all of them.

---

## 6. UploadThing — How File Uploads Work

### Why Not Upload Directly to Our Server?

If a user uploads a 30MB PDF:
1. It would have to travel from browser → Next.js server → storage
2. Next.js serverless functions have request size limits
3. Our server would be tied up receiving the file
4. We'd need to manage our own cloud storage

UploadThing solves this with a different approach.

### The URL Handoff Architecture

```
Browser → asks our server: "Can I upload a file?"
        ↓
Our server (checks auth) → tells UploadThing: "Yes, allow it"
        ↓
UploadThing → gives browser a signed URL
        ↓
Browser → uploads file DIRECTLY to UploadThing's CDN
          (never touches our server)
        ↓
UploadThing → notifies our server: "Upload complete, here's the URL"
        ↓
Our server → saves URL to MongoDB
```

The key insight: **the actual file bytes never go through our Next.js server.** Only the metadata (file URL, file name) does.

### The Configuration

```typescript
// src/lib/uploadthing/core.ts
export const ourFileRouter = {
  pdfUploader: f({
    pdf: {
      maxFileSize: "32MB",
      maxFileCount: 1,
    },
  })
  .middleware(async () => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    return { userId }; // passed to onUploadComplete
  })
  .onUploadComplete(async ({ metadata, file }) => {
    console.log("Upload complete:", file.url);
    return { fileUrl: file.url };
  }),
};
```

**`.middleware()`** — runs before the upload starts, on our server. Checks that the user is logged in. If we throw an error here, the upload is rejected.

**`.onUploadComplete()`** — runs on our server after the file is stored. We use this to log; the actual MongoDB save happens from the client via a separate API call.

**`f({ pdf: { maxFileSize: "32MB" } })`** — restricts uploads to PDFs under 32MB. UploadThing enforces this, not our code.

### The API Route

```typescript
// src/app/api/uploadthing/route.ts
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
```

This single line creates the GET and POST handlers that UploadThing's SDK needs to negotiate uploads.

### The Frontend Component

```typescript
<UploadDropzone
  endpoint="pdfUploader"
  onClientUploadComplete={async (res) => {
    const file = res[0]; // array because maxFileCount could be > 1
    // Now save metadata to our database:
    await fetch("/api/projects/${projectId}/papers", {
      method: "POST",
      body: JSON.stringify({ title, fileUrl: file.url }),
    });
  }}
  onUploadError={(error) => {
    console.error(error.message);
  }}
/>
```

`onClientUploadComplete` runs in the browser after the upload succeeds. `res[0].url` is the CDN URL of the uploaded file (e.g., `https://utfs.io/f/abc123`).

### The UPLOADTHING_TOKEN

In UploadThing v7+, a single token (a long base64 string) replaces the old separate API key + app ID. This token is set as `UPLOADTHING_TOKEN` in `.env.local`. The SDK reads it automatically — we never reference it in code directly.

---

## 7. MongoDB and Mongoose — The Database Layer

### What is MongoDB?

MongoDB is a **NoSQL database** that stores data as **documents** (JSON-like objects) instead of rows in tables. 

SQL (relational) approach:
```sql
CREATE TABLE projects (id INT, title VARCHAR, userId VARCHAR);
```

MongoDB approach:
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Transformer Survey",
  "clerkUserId": "user_abc123",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### What is Mongoose?

MongoDB itself doesn't enforce any structure — you could save anything in any collection. Mongoose adds **schemas** (structure definitions) and **models** (classes for interacting with collections).

### Connection Management

```typescript
// src/lib/mongodb.ts
const cached = global.mongoose ?? { conn: null, promise: null };

export async function connectToDatabase() {
  if (cached.conn) return cached.conn; // reuse existing connection
  // ... create new connection
}
```

**Why global caching?** Next.js in development mode hot-reloads files constantly. Without caching, each reload would create a new database connection until you hit MongoDB's connection limit. The global cache persists across hot reloads.

### The Three Schemas

#### Project Schema
```typescript
// Represents a research project folder
{
  title: String,        // "Transformer Architectures Survey"
  description: String,  // "Comparing attention mechanisms"
  clerkUserId: String,  // links to Clerk user
  createdAt: Date,      // auto-managed by timestamps: true
  updatedAt: Date,      // auto-managed
}
```

#### Paper Schema
```typescript
// Represents one uploaded PDF
{
  projectId: ObjectId,  // which project it belongs to
  clerkUserId: String,  // who uploaded it (for security checks)
  title: String,        // "Attention Is All You Need"
  authors: [String],    // ["Vaswani, A.", "Shazeer, N."]
  fileUrl: String,      // "https://utfs.io/f/abc123"
  status: String,       // "processing" | "ready" | "error"
  chunkCount: Number,   // how many chunks were created (set after ingestion)
  createdAt: Date,
  updatedAt: Date,
}
```

#### ChatSession Schema
```typescript
// Represents a conversation within a project
{
  projectId: ObjectId,
  clerkUserId: String,
  title: String,        // "New conversation"
  messages: [{
    role: String,       // "user" | "assistant"
    content: String,    // the message text
    citations: [{       // which papers were cited
      paperId: ObjectId,
      paperTitle: String,
      page: Number,
    }],
    createdAt: Date,
  }],
}
```

### Why `clerkUserId` Appears in Both Project AND Paper

Security defense-in-depth. When deleting a paper, we query:
```typescript
PaperModel.findOne({ _id: paperId, projectId, clerkUserId: userId })
```
Even if an attacker knows both the `paperId` and `projectId`, the `clerkUserId` check ensures they can only access their own papers.

### ObjectId vs String

MongoDB automatically generates `_id` as an `ObjectId` (a 24-character hex string like `507f1f77bcf86cd799439011`). When sending to the frontend, we convert it: `project._id.toString()`. This is why you see `id: doc._id.toString()` throughout the API routes.

### `.lean()`

```typescript
const projects = await ProjectModel.find({ clerkUserId: userId }).lean();
```

`.lean()` returns plain JavaScript objects instead of full Mongoose document instances. Mongoose documents have many extra methods attached (`.save()`, `.populate()`, etc.). For read-only operations, `.lean()` is faster and uses less memory.

### `timestamps: true`

```typescript
const ProjectSchema = new Schema({ ... }, { timestamps: true });
```

This automatically adds `createdAt` and `updatedAt` fields and manages them. MongoDB updates `updatedAt` on every save automatically.

### Indexes

```typescript
clerkUserId: { type: String, index: true }
```

An index makes queries on that field fast. Without an index, MongoDB scans every document to find matches. With an index, it can jump directly to matching documents. We index `clerkUserId` because almost every query filters by it.

---

## 8. The RAG Pipeline — The AI Brain

This is the most technically complex part. Let's break it down completely.

### What is a Vector Embedding?

A vector embedding is a way to represent text as an array of numbers such that texts with similar meanings have numerically similar arrays.

```
"neural networks learn from data"  → [0.2, -0.5, 0.8, 0.1, ...]
"deep learning uses training data" → [0.21, -0.48, 0.79, 0.12, ...]  ← similar!
"the weather is sunny today"       → [-0.7, 0.3, -0.2, 0.9, ...]     ← different
```

The model we use (`all-MiniLM-L6-v2`) converts any text into a 384-dimensional vector. Two texts are semantically similar if their vectors are close in this 384-dimensional space (measured by cosine similarity).

### The Full Pipeline

#### Phase 1: Ingestion (happens when a paper is uploaded)

```
PDF file URL (from UploadThing)
        ↓
loader.py: Download PDF → write to temp file
        ↓
PyPDFLoader: Extract text page by page
        ↓
Tag each page with metadata:
  { paper_id, project_id, paper_title, authors, page_number }
        ↓
chunker.py: Split text into 500-character overlapping chunks
  (overlap=50 means consecutive chunks share 50 characters)
  Why overlap? So that context isn't lost at chunk boundaries
        ↓
embedder.py: Convert each chunk to a 384-dimensional vector
  Using: all-MiniLM-L6-v2 (471MB HuggingFace model)
        ↓
vector_store.py: Store all vectors in FAISS
        ↓
Save FAISS index to disk:
  rag/faiss_indexes/project_{projectId}/index.faiss
  rag/faiss_indexes/project_{projectId}/index.pkl
```

**Why 500 characters per chunk?** 

Too large: the chunk contains too much irrelevant text mixed with relevant text.  
Too small: the chunk loses context (a sentence without its surrounding paragraph).  
500 characters (~100 words) is empirically a good balance for academic papers.

**Why save to disk?**

FAISS is in-memory. If the FastAPI server restarts, all vectors would be lost. Saving to disk means the index persists across restarts.

**Why one FAISS index per project (not per paper)?**

For multi-paper synthesis, we need to search across ALL papers in a project simultaneously. If we had separate indexes per paper, we'd need to query each one and merge results — complex and slow. One shared project index means one query returns the most relevant chunks from any paper.

#### Phase 2: Query (happens when user sends a chat message)

```
User's question: "How do BERT and GPT-3 differ?"
        ↓
Convert question to a 384-dimensional vector
  (using the same embedding model)
        ↓
FAISS: Find top-6 most similar vectors in the project index
  (cosine similarity search — mathematically finds nearest vectors)
        ↓
Retrieve the text chunks those vectors represent
  Each chunk has metadata: { paper_title, authors, page, content }
        ↓
Deduplicate: keep only one chunk per paper
  (avoids citing the same paper 6 times)
        ↓
Return chunks to Next.js
```

**Why deduplicate?**

Without deduplication, if you upload one paper, all 6 results might come from the same paper, making the LLM think there are 6 different sources when there's only 1.

#### Phase 3: Generation (happens after retrieval)

```
Retrieved chunks + their metadata
        ↓
Build a prompt:
  "You are an expert academic assistant...
   [1] "Attention Is All You Need" by Vaswani et al., p.4
   [chunk text]
   ---
   [2] "BERT" by Devlin et al., p.12
   [chunk text]
   ---
   User: How do BERT and GPT-3 differ?
   Assistant:"
        ↓
Send prompt to Ollama (llama3.2 model)
        ↓
Ollama streams response token by token
        ↓
Next.js forwards the stream to the browser
        ↓
Browser renders tokens as they arrive (streaming UI)
```

### Why Streaming?

LLMs generate text one token at a time. Without streaming, the user would wait 30 seconds seeing nothing, then suddenly the full response appears. With streaming, they see words appearing as they're generated — much better UX.

The stream flows through three layers:
1. Ollama → FastAPI's HTTP response body (line-delimited JSON)
2. FastAPI/Next.js → Browser (plain text stream)
3. Browser reads the stream chunk by chunk, appending to the displayed message

### The Metadata Tagging Strategy

Each chunk stores:
```python
doc.metadata.update({
    "paper_id":    paper_id,     # MongoDB Paper _id
    "project_id":  project_id,   # MongoDB Project _id
    "paper_title": paper_title,  # "Attention Is All You Need"
    "authors":     "Vaswani, A., Shazeer, N.",
})
```

PyPDFLoader automatically adds `"page": 0` (0-indexed page number). We add `+1` when displaying to make it human-readable.

When a chunk is retrieved, its metadata travels with it. This is how the LLM knows which paper each piece of context came from — enabling it to write citations like `[1]` and `[2]`.

---

## 9. FastAPI — The Python Server

### What is FastAPI?

FastAPI is a Python web framework for building APIs. It's comparable to Express.js in Node.js. It's called "Fast" because it's built on async Python and because it's fast to develop with.

### Key Features Used

**Pydantic Models** — Request/response validation:
```python
class IngestRequest(BaseModel):
    doc_id: str
    project_id: str
    file_url: str
    paper_title: str
    authors: list[str] = []
```

FastAPI automatically validates incoming JSON against this model. If `doc_id` is missing, it returns a 422 error automatically. This is why 422 errors usually mean the request body shape is wrong.

**BackgroundTasks** — Running work after responding:
```python
@app.post("/ingest", status_code=202)
def ingest(req: IngestRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(run_ingestion, req.doc_id, ...)
    return {"message": "started"} # returns immediately
    # run_ingestion() continues running in background
```

This is critical. PDF ingestion takes 30-60 seconds. We can't make the user wait. So:
1. FastAPI receives the request → returns 202 immediately
2. `run_ingestion()` continues running in the background
3. When done, it calls back to Next.js (`/api/ingest-callback`) to update MongoDB

**HTTP status codes used:**
- `200` — success
- `201` — created (new resource)
- `202` — accepted (processing started, not finished)
- `401` — unauthorized
- `404` — not found
- `422` — unprocessable (validation failed)
- `500` — server error

### The Internal Token Security

```python
def verify_internal_token(x_internal_token: str = Header(...)):
    if x_internal_token != os.environ["INTERNAL_API_SECRET"]:
        raise HTTPException(status_code=401, detail="Unauthorized")
```

FastAPI runs on port 8000. Without security, anyone who knows your IP could call your RAG API directly, trigger ingestion, and run up compute costs. The shared secret (`INTERNAL_API_SECRET`) ensures only your Next.js server can call FastAPI.

### The Automatic Documentation

FastAPI auto-generates interactive API documentation at `http://localhost:8000/docs`. This uses the OpenAPI standard. You can test all endpoints directly from the browser — extremely useful for debugging.

### The Callback Pattern

```
Next.js → POST /ingest → FastAPI (returns 202 immediately)
                              ↓ (background, 30-60 seconds later)
Next.js ← POST /api/ingest-callback ← FastAPI
```

FastAPI calls BACK to Next.js when ingestion finishes. Next.js then updates MongoDB with `status: "ready"`. The frontend polls the status every 5 seconds and flips the badge when it sees "ready."

---

## 10. Ollama — The Local LLM

### What is Ollama?

Ollama is a tool that runs open-source LLMs on your local machine. It downloads models, manages them, and serves them via an HTTP API on port 11434.

### How We Call It

```typescript
// From Next.js /api/chat/route.ts
const response = await fetch("http://127.0.0.1:11434/api/generate", {
  method: "POST",
  body: JSON.stringify({
    model: "llama3.2",
    prompt: "Your prompt here...",
    stream: true,     // send tokens as they're generated
  }),
});
```

Ollama responds with newline-delimited JSON:
```
{"response": "The", "done": false}
{"response": " answer", "done": false}
{"response": " is", "done": false}
{"response": "...", "done": true}
```

We parse each line, extract the `response` field, and forward it to the browser.

### Why llama3.2?

It's small enough to run on a laptop (doesn't require a GPU), fast enough for interactive use, and capable enough for reading academic text and generating citations. For a production system you'd use a larger model (Llama 3.2 70B, Mistral, etc.) on a proper server.

### The Prompt Engineering

The prompt is carefully crafted:
```
You are an expert academic research assistant...

CRITICAL INSTRUCTIONS:
- Answer ONLY based on the provided paper excerpts below.
- You MUST cite the paper number (e.g. [1], [2]) after every claim.
- When comparing findings across papers, explicitly name which paper says what.
- If the answer cannot be found, say "The provided papers do not contain..."
```

**Why so prescriptive?** LLMs by default will answer from their training data, ignore the context, make up citations, etc. Strong instructions in the system prompt override these default behaviors.

---

## 11. Every Page Explained

### Landing Page (`/`) — `src/app/page.tsx`

**Type:** Server Component (async)  
**First thing it does:** Calls `auth()`. If user is already logged in, immediately redirects to `/dashboard`. This prevents logged-in users from seeing the marketing page.  
**What it renders:** Hero section, "How it works" cards, example queries, mock UI preview, CTA banner.  
**No interactivity:** It's a pure server-rendered marketing page. All links are `<Link>` tags, no client state needed.

### Sign In / Sign Up (`/sign-in`, `/sign-up`)

**Type:** Server Component  
**What they render:** Just the Clerk-provided `<SignIn />` and `<SignUp />` components, centered on the page. Clerk renders the entire form, handles validation, manages the session. After login, Clerk redirects to `/dashboard` (configured via `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`).

### Dashboard (`/dashboard`) — `src/app/dashboard/page.tsx`

**Type:** Server Component  
**What it does:**
1. Calls `auth()` → gets `userId`
2. If no user → `redirect("/sign-in")`
3. Queries MongoDB for all projects belonging to this user
4. For each project, counts total papers and ready papers
5. Passes all this data to `<DashboardClient>`

**Why is the data fetching here and not in `DashboardClient`?**  
Server components can query MongoDB directly. Client components cannot — they'd need to call an API route. Fetching in the server component is faster (no extra HTTP round-trip) and simpler.

### Project Workspace (`/project/[projectId]`) — `src/app/project/[projectId]/page.tsx`

**Type:** Server Component  
**What it does:**
1. Awaits `params` (Next.js 15 requirement)
2. Verifies auth
3. Tries to find the project in MongoDB, verifies it belongs to this user
4. Wraps in `try/catch` because an invalid `projectId` format would throw a MongoDB error
5. If project not found → `notFound()` → shows 404 page
6. Passes project + papers to `<WorkspaceClient>`

---

## 12. Every Component Explained

### `DashboardClient` — `src/components/dashboard-client.tsx`

**Type:** Client Component (`"use client"`)  
**State:**
- `search` — the current search filter text
- `createOpen` — whether the "New Project" dialog is open

**What it renders:** Nav bar, page header, search input, project grid, `<CreateProjectDialog>`  
**Key logic:** Filters the `projects` array passed from the server component based on the `search` string. No API call needed for search — it's client-side filtering of already-loaded data.

### `ProjectCard` — `src/components/project-card.tsx`

**Type:** Client Component  
**State:**
- `confirmOpen` — whether the delete confirmation dialog is open
- `isDeleting` — whether a delete is in progress (disables buttons)

**What it renders:** Card with project title, description, paper count badge, status badge, dropdown menu with "Delete" option, confirmation dialog.  
**Key logic:** On delete confirmation, calls `DELETE /api/projects/[projectId]`, then calls `onDeleted()` (a function passed from the parent) which triggers `router.refresh()` to re-fetch from MongoDB.

### `CreateProjectDialog` — `src/components/create-project-dialog.tsx`

**Type:** Client Component  
**State:**
- `title`, `description` — controlled form inputs
- `isCreating` — loading state
- `error` — error message if creation fails

**What it does:** Posts to `POST /api/projects` with title and description. On success, clears form and calls `onCreated()` which triggers `router.refresh()`.

### `WorkspaceClient` — `src/components/workspace-client.tsx`

**Type:** Client Component  
**State:**
- `papers` — array of papers (starts with server-fetched data, updated locally when papers are added/deleted)
- `selectedPaper` — which paper is currently open in the PDF viewer
- `leftTab` — "papers" | "viewer" (which tab is shown)
- `uploadOpen` — whether upload dialog is open
- `leftPanelOpen` — whether left panel is visible at all

**Why manage `papers` in local state instead of always re-fetching?**  
When a paper is uploaded, instead of hitting MongoDB again, we append it directly to the local `papers` array. This gives instant UI feedback. The server is updated in parallel. This pattern is called **optimistic updates**.

**The PDF viewer blinking fix:** The `PdfViewer` component is kept permanently mounted using `className="hidden"` to hide it rather than conditional rendering (`{condition && <Component>}`). Conditional rendering unmounts the component, causing it to reload the PDF from scratch each time.

### `PaperItem` — `src/components/paper-item.tsx`

**Type:** Client Component  
**State:**
- `status` — starts as the paper's status from the server, updated by polling
- `confirmOpen`, `isDeleting` — for delete confirmation

**Key logic — Status polling:**
```typescript
useEffect(() => {
  if (status !== "processing") return; // don't poll if already done

  const interval = setInterval(async () => {
    const res = await fetch(`/api/projects/${projectId}/papers/${paper.id}/status`);
    const data = await res.json();
    if (data.status !== "processing") {
      setStatus(data.status);  // update local state
      clearInterval(interval);  // stop polling
      if (data.status === "ready") onReady(); // notify parent
    }
  }, 5000); // check every 5 seconds

  return () => clearInterval(interval); // cleanup on unmount
}, [status]);
```

This is a **polling pattern** — repeatedly checking an endpoint until a condition is met. The `return () => clearInterval(interval)` is critical — it's a cleanup function that stops the polling if the component unmounts (e.g., user navigates away).

### `UploadPaperDialog` — `src/components/upload-paper-dialog.tsx`

**Type:** Client Component  
**State:**
- `state` — "form" | "uploading" | "saving" | "success" | "error" (a state machine)
- `title`, `authorInput`, `authors` — form fields

**The author system:** Authors are added one at a time. `authorInput` is the text in the input. When "+" is clicked or Enter is pressed, the author is added to the `authors` array and `authorInput` is cleared. This gives a tag-like UX.

**Why is `title` required before the dropzone is enabled?**  
We need the title to pass to the ingestion pipeline for metadata tagging. The dropzone has a `disabled={!title.trim()}` prop.

### `ChatWindow` — `src/components/chat-window.tsx`

**Type:** Client Component  
**State:**
- `messages` — array of message objects
- `input` — current text in the textarea
- `isLoading` — whether a request is in progress
- `error` — error message if something fails
- `abortRef` — a ref (not state) holding an AbortController

**The streaming implementation:**
```typescript
const reader = res.body.getReader(); // ReadableStream reader
const decoder = new TextDecoder();
let fullContent = "";

while (true) {
  const { done, value } = await reader.read(); // read next chunk
  if (done) break;
  
  fullContent += decoder.decode(value, { stream: true });
  
  setMessages(prev => prev.map(m =>
    m.id === assistantMsg.id
      ? { ...m, content: fullContent } // update in place
      : m
  ));
}
```

Each `read()` call returns a `Uint8Array` of bytes. `TextDecoder` converts bytes to a string. We append to `fullContent` and update the message's content with each new chunk — creating the streaming text effect.

**Why `useRef` for abortRef instead of `useState`?**  
`AbortController` doesn't need to trigger a re-render when it changes — it's just a handle for cancelling a request. `useRef` stores values that persist across renders without causing re-renders.

### `PdfViewer` — `src/components/pdf-viewer.tsx`

**Type:** Client Component (`ssr: false` in dynamic import)  
**State:**
- `numPages` — total pages in the PDF
- `currentPage` — which page is displayed
- `zoom` — current zoom level (0.5 to 2.5)
- `pageInput` — the text in the page number input (string, not number, because it can be empty mid-editing)
- `loadState` — "loading" | "success" | "error"

**Why `ssr: false`?**  
pdf.js uses `canvas` and `window` APIs that don't exist in Node.js (the server environment). Attempting to render it on the server would throw errors.

**The worker setup:**
```typescript
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
```
pdf.js offloads PDF parsing to a Web Worker (a separate browser thread) to avoid blocking the UI. We copy the worker file to `/public/` so the browser can load it.

---

## 13. Every API Route Explained

### `POST /api/projects`
Creates a new project. Validates that `title` is present. Creates a MongoDB document. Returns the created project.

### `GET /api/projects`
Returns all projects for the logged-in user. Also counts papers per project (total and ready) using `PaperModel.countDocuments()`. This avoids fetching all papers just to count them.

### `DELETE /api/projects/[projectId]`
Deletes a project and everything it contains:
1. Find all papers in the project
2. For each paper: delete from UploadThing CDN, delete FAISS index from FastAPI
3. Delete all MongoDB records (project, papers, chat sessions)

Uses `Promise.allSettled()` instead of `Promise.all()`. The difference:
- `Promise.all()` — if ANY operation fails, the whole thing throws
- `Promise.allSettled()` — all operations run, failures are logged but don't stop other operations

This means if the UploadThing delete fails (e.g., file already deleted), the MongoDB delete still goes through.

### `POST /api/projects/[projectId]/papers`
Adds a paper to a project. Verifies the project belongs to the user. Creates a `Paper` document with `status: "processing"`. Calls `triggerIngestion()` which calls `POST /ingest` on FastAPI (which returns 202 immediately). Returns the new paper to the client.

### `DELETE /api/projects/[projectId]/papers/[paperId]`
Deletes one paper: from MongoDB, from UploadThing, and calls `DELETE /project/{projectId}/paper/{paperId}` on FastAPI to rebuild the FAISS index without that paper.

### `GET /api/projects/[projectId]/papers/[paperId]/status`
Called every 5 seconds by `PaperItem` while a paper is processing. Returns `{ status, chunkCount }`. Simple MongoDB query.

### `POST /api/ingest-callback`
Called BY FastAPI (not by the user's browser) when ingestion completes. Verifies the internal token. Updates the Paper's `status` and `chunkCount` in MongoDB.

### `POST /api/chat`
The most complex route:
1. Verify auth
2. Parse `{ projectId, question, history }` from body
3. Verify user owns the project
4. Check at least one paper is `status: "ready"`
5. Call `POST /query` on FastAPI → get relevant chunks
6. Build a prompt with chunks and conversation history
7. Call Ollama's `/api/generate` with `stream: true`
8. Transform Ollama's newline-delimited JSON stream into a plain text stream
9. Return the stream as the response

**Why not call Ollama from FastAPI?**  
We could. But then FastAPI would need to handle streaming back to Next.js which streams back to the browser — three layers of streaming complexity. Having Next.js call Ollama directly for generation simplifies the architecture.

### `GET /api/uploadthing` and `POST /api/uploadthing`
Auto-generated by UploadThing's `createRouteHandler`. These handle the authentication handshake that allows uploads to proceed.

---

## 14. React Hooks — Every One Used

React hooks are functions that let components access React features (state, lifecycle, etc.) without writing class components.

### `useState`

```typescript
const [count, setCount] = useState(0);
//     ↑ current value  ↑ function to update it  ↑ initial value
```

When `setCount` is called, React re-renders the component with the new value. **Never mutate state directly** — always use the setter function.

**Used for:** papers array, selected paper, tab state, dialog open/close, form inputs, loading states, error messages.

### `useEffect`

```typescript
useEffect(() => {
  // runs after every render where [dependency] changed
  
  return () => {
    // cleanup — runs before next effect or on unmount
  };
}, [dependency]); // only re-run when this changes
```

**Used for:**
- Starting/stopping the polling interval in `PaperItem`
- Auto-scrolling to the bottom of chat when messages update
- `[]` (empty array) = run once on mount only

### `useRef`

```typescript
const bottomRef = useRef<HTMLDivElement>(null);
// bottomRef.current is the actual DOM element
bottomRef.current?.scrollIntoView({ behavior: "smooth" });
```

`useRef` stores a value that:
1. Persists across renders (unlike local variables)
2. Does NOT trigger a re-render when changed (unlike `useState`)

**Used for:**
- `bottomRef` — reference to the bottom of the chat to auto-scroll
- `abortRef` — stores the `AbortController` for cancelling requests

### `useRouter`

```typescript
const router = useRouter();
router.refresh(); // re-run server data fetching, keep client state
router.push("/dashboard"); // navigate programmatically
```

From `next/navigation`. Used to programmatically navigate and to refresh server data.

### `useState` with functional updates

```typescript
setPapers(prev => [...prev, newPaper]);
// ↑ uses the previous state guaranteed, avoids stale closure bugs
```

When new state depends on old state, always use the functional form. If you just wrote `setPapers([...papers, newPaper])`, `papers` might be stale in an async context.

---

## 15. Data Flow — Tracing Every Feature End to End

### Feature: User Signs Up

1. User visits `/sign-up`
2. Clerk renders the sign-up form (not our code)
3. User fills in email + password
4. Clerk creates a user account, sets a session cookie
5. Clerk redirects to `/dashboard` (per `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`)
6. Dashboard's `auth()` finds the session → shows empty dashboard

### Feature: Creating a Project

1. User clicks "New Project" → `setCreateOpen(true)` in `DashboardClient`
2. `CreateProjectDialog` renders with empty form
3. User types title, clicks "Create project"
4. `handleCreate()` runs: `POST /api/projects` with `{ title, description }`
5. Server route: `auth()` → `ProjectModel.create({...})` → returns new project
6. Dialog closes, `onCreated()` called → `router.refresh()`
7. `router.refresh()` re-runs `DashboardPage` server component → re-queries MongoDB
8. New project card appears

### Feature: Uploading a Paper

1. User opens workspace, clicks "Add paper"
2. Fills in title and authors in `UploadPaperDialog`
3. Drops PDF on the `<UploadDropzone>` component
4. UploadThing: browser asks our server for upload permission
5. Our server's middleware checks Clerk auth → grants permission
6. Browser uploads PDF directly to UploadThing CDN (not through our server)
7. `onClientUploadComplete` fires with `file.url`
8. We `POST /api/projects/[projectId]/papers` with `{ title, authors, fileUrl }`
9. Server creates `Paper` document with `status: "processing"`
10. Server calls `POST /ingest` on FastAPI (fire and forget)
11. FastAPI returns 202 immediately
12. Next.js returns the new paper to the client
13. Dialog closes, paper appears in list with "Processing…" badge
14. FastAPI background task: downloads PDF, chunks it, embeds it, saves FAISS index
15. FastAPI calls `POST /api/ingest-callback` on Next.js
16. Next.js updates `Paper.status = "ready"` in MongoDB
17. Meanwhile, `PaperItem` has been polling `/status` every 5 seconds
18. Polling sees "ready" → updates local state → badge flips to "Ready ✓"

### Feature: Asking a Question

1. User types in `ChatWindow` textarea, hits Enter
2. `handleSend()` runs:
   - Adds user message to `messages` array
   - Adds empty assistant message (will be filled by stream)
3. `POST /api/chat` with `{ projectId, question, history }`
4. Server: verifies auth, verifies project ownership
5. Server: `POST /query` to FastAPI with `{ project_id, question }`
6. FastAPI: converts question to vector, searches FAISS, returns top chunks
7. Server: deduplicates chunks by paper, builds prompt
8. Server: calls Ollama `/api/generate` with `stream: true`
9. Server: creates a `ReadableStream` that forwards Ollama's tokens
10. Browser: reads the stream chunk by chunk in a `while(true)` loop
11. Each chunk: `fullContent += chunk` → `setMessages(...)` updates the assistant message in place
12. User sees text appearing word by word
13. Stream ends → `isStreaming: false` → cursor stops blinking

### Feature: Deleting a Paper

1. User clicks ⋮ → "Delete paper" on a `PaperItem`
2. Confirmation dialog opens
3. User confirms → `handleDelete()` runs
4. `DELETE /api/projects/[projectId]/papers/[paperId]`
5. Server: finds paper, verifies ownership
6. `Promise.allSettled([...])` runs three operations in parallel:
   - MongoDB: `PaperModel.findByIdAndDelete(paperId)`
   - UploadThing: `utApi.deleteFiles(fileKey)` — removes file from CDN
   - FastAPI: `DELETE /project/{projectId}/paper/{paperId}` — rebuilds FAISS index without this paper's chunks
7. Server returns `{ success: true }`
8. `onDeleted()` called in `WorkspaceClient` → removes paper from local `papers` array
9. If this was the selected paper: `setSelectedPaper(null)`, switch to papers tab

---

## 16. The Database Schema Design — Why It's Structured This Way

### The Original Design (before pivot)

```
User → Document (1-to-many)
```

Simple but limited to one PDF per "session."

### The Current Design

```
User → Project → Paper (1-to-many-to-many)
User → Project → ChatSession → Message
```

This is a **hierarchical** data model. Each level "contains" the next.

### Why Not Just Store Papers Without Projects?

A researcher working on a literature review might have 20 papers across 3 different topics. Without projects:
- "Attention mechanism papers"
- "Training efficiency papers" 
- "Evaluation benchmark papers"

Would all be in one flat list. Projects give researchers a way to group related papers and keep their work organized.

### Why `clerkUserId` in BOTH Project AND Paper?

Security shortcut. When querying a paper, if we only stored `projectId`, we'd need to:
1. Find the paper by `paperId`
2. Find the project by `projectId`
3. Verify the project's `clerkUserId` matches

With `clerkUserId` in Paper:
1. Find paper by `paperId` AND `clerkUserId` in one query

One database call instead of two. More efficient, and the security check is atomic.

### Why `status` in Paper?

Papers go through a lifecycle:
```
"processing" → FAISS ingestion running
"ready"      → user can now query this paper
"error"      → ingestion failed
```

The frontend reads this status to know whether to enable the chat (only when at least one paper is "ready") and what badge to show.

### Why `chunkCount` in Paper?

Purely informational — displayed in the UI as "93 chunks." Helps researchers understand how much of their paper was successfully processed.

---

## 17. Security — How Every Layer Is Protected

### Layer 1: Clerk Authentication

Every protected page and API route calls `auth()` first. Without a valid session, the request is rejected before any data is touched.

```typescript
const { userId } = await auth();
if (!userId) return new Response("Unauthorized", { status: 401 });
```

### Layer 2: Ownership Verification

Even authenticated users can only access their own data:

```typescript
const project = await ProjectModel.findOne({
  _id: projectId,
  clerkUserId: userId, // ← not just by ID
});
if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
```

**Returning 404 instead of 403:** This is intentional. If someone is probing your API, returning 403 (Forbidden) tells them "this exists, you just can't access it." Returning 404 gives away no information.

### Layer 3: Internal API Secret

FastAPI endpoints are protected by a shared secret:

```typescript
// Next.js sends:
headers: { "x-internal-token": process.env.INTERNAL_API_SECRET }

// FastAPI checks:
if x_internal_token != os.environ["INTERNAL_API_SECRET"]:
    raise HTTPException(status_code=401)
```

This prevents anyone who discovers port 8000 from calling your RAG endpoints.

### Layer 4: UploadThing Middleware

```typescript
.middleware(async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return { userId };
})
```

The upload permission check runs on our server before any upload starts. Unauthenticated users cannot get a signed upload URL.

### Layer 5: File Type Enforcement

```typescript
f({ pdf: { maxFileSize: "32MB", maxFileCount: 1 } })
```

UploadThing enforces these constraints server-side. Even if someone bypasses our UI, they cannot upload non-PDFs or files over 32MB.

### Layer 6: URL Validation

```typescript
if (!fileUrl.startsWith("https://")) {
  return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
}
```

Simple but important — prevents malformed URLs from reaching the database.

### Environment Variables

- Server-only secrets (`CLERK_SECRET_KEY`, `MONGODB_URI`, `INTERNAL_API_SECRET`) are never sent to the browser
- `.env.local` is in `.gitignore` — never committed to version control
- `NEXT_PUBLIC_` variables ARE sent to the browser — only public keys go here

---

## 18. Common Interview Questions and Model Answers

**Q: "What is RAG and why did you use it?"**

A: RAG stands for Retrieval-Augmented Generation. Instead of asking an LLM to answer from its training data, you first retrieve relevant passages from your own documents, then give those passages to the LLM as context. The LLM generates its answer based only on what you retrieved. We used it because researchers need answers that cite specific papers — a general LLM might hallucinate citations or answer from general knowledge rather than the actual uploaded papers.

---

**Q: "What's the difference between a Server Component and Client Component?"**

A: Server Components run on the server and can directly access databases and secrets, but can't use React hooks or handle events. Client Components run in the browser, can use hooks and handle events, but can't directly access databases. We use server components to fetch data from MongoDB (because it's faster and more secure) and pass it to client components that handle the interactive UI.

---

**Q: "How does authentication work in your app?"**

A: We use Clerk. When a user logs in, Clerk sets a secure HTTP-only cookie with a JWT session token. On every request to a protected route, our middleware calls Clerk's `auth()` which reads that cookie and returns a `userId`. We store that `userId` in MongoDB alongside every piece of data, and always filter queries by `userId` so users can only see their own data.

---

**Q: "How do file uploads work?"**

A: We use a URL handoff architecture with UploadThing. When a user selects a file, our server first checks authentication and grants permission. UploadThing then gives the browser a signed URL. The browser uploads the file directly to UploadThing's CDN — never through our server. When the upload completes, the browser receives the file's CDN URL and sends that URL to our API, which saves it to MongoDB. This means large files don't strain our server.

---

**Q: "Why did you use FAISS instead of a cloud vector database like Pinecone?"**

A: For a college project, FAISS is free, runs locally, and has no API limits. We save FAISS indexes to disk so they persist across server restarts. The trade-off is that FAISS doesn't scale horizontally and is tied to one machine. For a production system with many users, a cloud vector database like Pinecone or Weaviate would be better because it scales independently.

---

**Q: "How does the streaming chat response work?"**

A: Ollama generates text token by token. With `stream: true`, it sends each token as a newline-delimited JSON object. Our Next.js API route reads this stream and forwards it as a plain text stream to the browser. The browser uses the Fetch API's `ReadableStream` to read chunks as they arrive and appends them to the message content. React re-renders the component with each new chunk, creating the word-by-word appearance.

---

**Q: "What would you change if this were a production app?"**

A: Several things. Replace FAISS with a cloud vector database for persistence and scaling. Replace Ollama with a hosted LLM API (Groq, Anthropic, OpenAI) for reliability. Add rate limiting on API routes. Implement chat history persistence in MongoDB (currently chat is lost on page refresh). Add paper processing queues (currently FastAPI BackgroundTasks is fine but doesn't retry on failure). Deploy FastAPI on Railway or a similar persistent server. Add monitoring and logging.

---

**Q: "Why are params awaited in Next.js 15?"**

A: In Next.js 15, dynamic route parameters were changed from synchronous objects to Promises. This was done to support streaming and partial rendering where parameters might not be immediately available. You must `await params` before accessing `params.projectId` or any other dynamic segment.

---

**Q: "What is a vector embedding?"**

A: A vector embedding is a way to represent text as an array of numbers (a vector) where texts with similar meanings have mathematically similar vectors. For example, "neural networks" and "deep learning" would have similar vectors even though the words are different. We use the `all-MiniLM-L6-v2` model from HuggingFace, which converts any text to a 384-dimensional vector. FAISS then finds the closest vectors to a query vector, which is how we retrieve semantically relevant chunks.

---

**Q: "What is the difference between `Promise.all` and `Promise.allSettled`?"**

A: `Promise.all` runs multiple async operations in parallel but throws if ANY of them fails, stopping the others. `Promise.allSettled` runs all operations and returns results for all of them, whether they succeeded or failed. We use `Promise.allSettled` for delete operations because if deleting from UploadThing fails, we still want to delete from MongoDB and FAISS. Partial cleanup is better than no cleanup.

---

**Q: "Why does the PDF viewer use `className='hidden'` instead of conditional rendering?"**

A: Conditional rendering (`{condition && <Component />}`) unmounts and remounts the component when the condition changes. For the PDF viewer, remounting means re-downloading and re-parsing the PDF — causing a visible flash. Using `className="hidden"` keeps the component mounted in the React tree but visually hidden with CSS. The PDF stays loaded in memory, so switching back to it is instant.

---

**Q: "What is the BackgroundTasks pattern in FastAPI and why did you use it?"**

A: FastAPI's `BackgroundTasks` allows you to queue a function to run after the HTTP response is sent. PDF ingestion takes 30-60 seconds — too long for an HTTP request to stay open. Instead, we return a `202 Accepted` response immediately, and the ingestion runs in the background. When it finishes, FastAPI calls back to our Next.js server via HTTP to update the paper's status in MongoDB. This keeps the UI responsive and the user gets immediate feedback that their upload was accepted.

---

*End of Documentation*

---
> Document generated for ScholarAI — Literature Review Copilot  
> Stack: Next.js 15 · TypeScript · Tailwind · Shadcn · Clerk · UploadThing · MongoDB · FastAPI · FAISS · LangChain · Ollama
