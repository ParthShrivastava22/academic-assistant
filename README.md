# 📚 Lexis — Context-Aware Academic Assistant

> Upload dense PDF textbooks and have natural AI-powered conversations with their content.

![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

---

## 📋 Table of Contents

- [What is Lexis?](#-what-is-lexis)
- [How It Works](#-how-it-works)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Pages & Features](#-pages--features)
- [Current Status](#-current-status)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)

---

## 🤔 What is Lexis?

Lexis is a **RAG (Retrieval-Augmented Generation)** web application. In plain English:

1. You upload a PDF textbook or academic paper
2. The app stores it securely in the cloud
3. You can then **chat with it** — ask questions in plain English and get answers that cite specific pages from your document

Think of it as having a conversation with your textbook instead of having to read and search through it manually.

---

## ⚙️ How It Works

```
You upload a PDF
       │
       ▼
UploadThing stores the file securely in the cloud
       │
       ▼
MongoDB saves the file metadata (title, URL, your user ID)
       │
       ▼
Your Dashboard shows all your uploaded documents
       │
       ▼
Click a document → Split-screen: PDF viewer + AI Chat
       │
       ▼
Ask questions → AI reads the document and answers with citations
```

> **Note:** The AI chat pipeline (the last step) is coming soon — see [Roadmap](#-roadmap).

---

## 🛠 Tech Stack

| Layer              | Technology                                                                | What it does                                                      |
| ------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Framework**      | [Next.js 15](https://nextjs.org/) (App Router)                            | The core web framework — handles pages, routing, and server logic |
| **Language**       | [TypeScript](https://www.typescriptlang.org/)                             | JavaScript with types — catches bugs before they happen           |
| **Styling**        | [Tailwind CSS](https://tailwindcss.com/)                                  | Utility-first CSS framework                                       |
| **UI Components**  | [Shadcn UI](https://ui.shadcn.com/)                                       | Pre-built, accessible UI components                               |
| **Authentication** | [Clerk](https://clerk.com/)                                               | Handles sign-up, sign-in, and user sessions                       |
| **File Storage**   | [UploadThing](https://uploadthing.com/)                                   | Stores the actual PDF files in the cloud                          |
| **Database**       | [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/) | Stores document metadata (titles, URLs, user IDs)                 |

---

## 📁 Project Structure

```
academic-assistant/
├── src/
│   ├── app/                          # All pages live here
│   │   ├── page.tsx                  # Landing page (/)
│   │   ├── layout.tsx                # Root layout (fonts, Clerk provider)
│   │   ├── globals.css               # Global styles
│   │   ├── sign-in/                  # Clerk sign-in page
│   │   ├── sign-up/                  # Clerk sign-up page
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Protected dashboard (/dashboard)
│   │   ├── chat/
│   │   │   └── [docId]/
│   │   │       └── page.tsx          # Chat interface (/chat/:id)
│   │   └── api/
│   │       ├── uploadthing/
│   │       │   └── route.ts          # UploadThing API handler
│   │       └── documents/
│   │           └── save/
│   │               └── route.ts      # Saves file metadata to MongoDB
│   │
│   ├── components/                   # Reusable UI components
│   │   ├── ui/                       # Auto-generated Shadcn components
│   │   ├── dashboard-client.tsx      # Interactive dashboard (search, grid)
│   │   ├── document-card.tsx         # Single document card component
│   │   ├── upload-dialog.tsx         # PDF upload modal
│   │   └── chat-window.tsx           # Chat UI (messages + input)
│   │
│   ├── lib/
│   │   ├── mongodb.ts                # MongoDB connection utility
│   │   └── uploadthing/
│   │       └── core.ts               # UploadThing config + auth middleware
│   │
│   ├── models/
│   │   └── Document.ts               # Mongoose schema for documents
│   │
│   └── middleware.ts                 # Clerk route protection
│
├── .env.local                        # Secret keys (never commit this!)
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 🚀 Getting Started

Follow these steps **exactly in order**. You will need:

- [Node.js](https://nodejs.org/) v18 or higher installed
- A code editor ([VS Code](https://code.visualstudio.com/) recommended)
- Terminal / Command Prompt access

### Step 1 — Clone the repository

```bash
git clone https://github.com/your-username/academic-assistant.git
cd academic-assistant
```

### Step 2 — Install dependencies

```bash
npm install
```

This installs everything the project needs. It may take a minute.

### Step 3 — Set up your accounts

You need free accounts on three external services. No credit card required.

#### 🔐 Clerk (Authentication)

1. Go to [clerk.com](https://clerk.com) and create a free account
2. Create a new application, name it "Lexis"
3. Go to **API Keys** in the sidebar
4. Copy the **Publishable Key** and **Secret Key**

#### 📁 UploadThing (File Storage)

1. Go to [uploadthing.com](https://uploadthing.com) and create a free account
2. Create a new app
3. Go to **API Keys** in the sidebar
4. Copy the **Token** (a long base64 string)

#### 🍃 MongoDB (Database)

1. Go to [mongodb.com](https://mongodb.com) and create a free account
2. Create a free **M0 cluster** (the free tier is fine)
3. Under **Database Access**, create a user with a username and password
4. Under **Network Access**, click **Add IP Address → Allow Access From Anywhere**
5. On your cluster, click **Connect → Compass or Drivers**
6. Copy the **connection string** — it looks like:
   `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`

### Step 4 — Create your environment file

Create a file called `.env.local` in the root of the project (same folder as `package.json`):

```bash
# On Mac/Linux:
touch .env.local

# On Windows (PowerShell):
New-Item .env.local
```

Then open it and paste the following, replacing each value with your real keys:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# UploadThing File Storage
UPLOADTHING_TOKEN=eyJhcGlLZXkiOiJz...

# MongoDB Database
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/lexis?retryWrites=true&w=majority
```

> ⚠️ **Important:** Never commit `.env.local` to Git. It's already listed in `.gitignore` to prevent this.

### Step 5 — Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You should see the Lexis landing page.

---

## 🔑 Environment Variables

Here's a full reference of every variable and where to get it:

| Variable                              | Where to get it                   | Required? |
| ------------------------------------- | --------------------------------- | --------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`   | Clerk Dashboard → API Keys        | ✅ Yes    |
| `CLERK_SECRET_KEY`                    | Clerk Dashboard → API Keys        | ✅ Yes    |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`       | Set to `/sign-in`                 | ✅ Yes    |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL`       | Set to `/sign-up`                 | ✅ Yes    |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Set to `/dashboard`               | ✅ Yes    |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Set to `/dashboard`               | ✅ Yes    |
| `UPLOADTHING_TOKEN`                   | UploadThing Dashboard → API Keys  | ✅ Yes    |
| `MONGODB_URI`                         | MongoDB Atlas → Connect → Drivers | ✅ Yes    |

---

## 📄 Pages & Features

### `/` — Landing Page

- Hero section explaining the app
- Feature highlights
- Mock UI preview
- Redirects logged-in users straight to `/dashboard`

### `/sign-in` and `/sign-up` — Authentication

- Handled entirely by Clerk
- Supports email/password and social logins (Google, GitHub, etc.)
- Configurable from your Clerk dashboard

### `/dashboard` — Your Document Library _(protected)_

- Only accessible when logged in — redirects to sign-in otherwise
- Shows a grid of all PDFs **you** have uploaded (each user only sees their own)
- Search bar to filter documents by title
- Document status badges: `Processing`, `Ready`, `Error`
- Upload button opens the PDF upload dialog

### Upload Dialog

- Drag-and-drop or click-to-browse PDF upload
- 32 MB file size limit, PDF only
- File is uploaded directly to UploadThing cloud storage
- On success, metadata is saved to MongoDB and the dashboard refreshes automatically

### `/chat/[docId]` — Chat Interface _(protected)_

- Split-screen layout
- **Left panel:** PDF viewer (placeholder — integration coming soon)
- **Right panel:** Chat interface with message history and sticky input
- AI responses will cite page numbers from your document

---

## ✅ Current Status

| Feature                           | Status         |
| --------------------------------- | -------------- |
| Landing page                      | ✅ Complete    |
| Authentication (Clerk)            | ✅ Complete    |
| PDF upload to cloud (UploadThing) | ✅ Complete    |
| Save metadata to MongoDB          | ✅ Complete    |
| Dashboard with user's documents   | ✅ Complete    |
| PDF viewer in chat page           | 🔲 Placeholder |
| AI chat pipeline (RAG)            | 🔲 Not started |
| Vector embeddings (Pinecone)      | 🔲 Not started |
| Streaming AI responses            | 🔲 Not started |

---

## 🗺 Roadmap

The next steps for this project are:

1. **PDF Processing** — When a document is uploaded, parse it into text chunks using LangChain
2. **Vector Embeddings** — Store the chunks in Pinecone so they can be searched semantically
3. **AI Chat API** — Build the `/api/chat` route that takes a question, finds relevant chunks from Pinecone, and passes them to an LLM (e.g. GPT-4 or Claude)
4. **Streaming Responses** — Stream the AI's answer back to the UI token by token
5. **PDF Viewer** — Integrate `react-pdf` to display the actual document alongside the chat
6. **Source Highlighting** — When the AI cites a page, jump to and highlight that section in the PDF viewer

---

## 🤝 Contributing

### Branching strategy

```
main          ← stable, production-ready code only
dev           ← integration branch, merge features here first
feature/xyz   ← your individual feature branches
```

### Workflow

```bash
# Always branch off dev, never main
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name

# Make your changes, then:
git add .
git commit -m "feat: describe what you did"
git push origin feature/your-feature-name

# Then open a Pull Request into dev on GitHub
```

### Commit message convention

| Prefix      | When to use                          |
| ----------- | ------------------------------------ |
| `feat:`     | Adding a new feature                 |
| `fix:`      | Fixing a bug                         |
| `style:`    | UI/styling changes only              |
| `refactor:` | Code restructure, no behavior change |
| `docs:`     | README or comment updates            |
| `chore:`    | Config, dependencies, tooling        |

### Never commit

- `.env.local` — contains secret keys
- `node_modules/` — auto-generated, too large for Git
- `.next/` — auto-generated build output

These are all already covered by `.gitignore`.

---

## ❓ Common Issues

**"Missing publishable key" error on startup**
→ Your `.env.local` file is missing or the Clerk keys aren't filled in. Make sure the file is in the project root (same level as `package.json`).

**Dashboard shows no documents after uploading**
→ Check that your `MONGODB_URI` is correct and that your MongoDB cluster's Network Access allows connections from anywhere (0.0.0.0/0).

**Upload fails immediately**
→ Check that your `UPLOADTHING_TOKEN` has no quotes around it in `.env.local`, then restart the dev server with `npm run dev`.

**Changes not reflecting after editing `.env.local`**
→ You must stop (`Ctrl+C`) and restart (`npm run dev`) the dev server — environment variables are not hot-reloaded.

---

<p align="center">Built with Next.js · Shadcn UI · Clerk · UploadThing · MongoDB</p>
