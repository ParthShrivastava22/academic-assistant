import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ProjectModel } from "@/models/Project";
import { PaperModel } from "@/models/Paper";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  projectId: string;
  question: string;
  history: Message[];
}

async function getRelevantChunks(question: string, projectId: string) {
  const res = await fetch(`${process.env.RAG_API_URL}/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-token": process.env.INTERNAL_API_SECRET!,
    },
    body: JSON.stringify({
      project_id: projectId,
      question,
    }),
  });

  if (!res.ok) throw new Error(`FastAPI /query failed: ${res.status}`);

  return res.json();
}

function buildPrompt(
  sources: {
    content: string;
    paper_title: string;
    authors: string[];
    page: number | null;
  }[],
  history: Message[],
  question: string,
): string {
  // Format each chunk with its paper citation
  const contextBlock = sources
    .map((s, i) => {
      const authors =
        s.authors.length > 0 ? s.authors.join(", ") : "Unknown Authors";
      const page = s.page !== null ? `, p.${s.page + 1}` : "";
      return `[${i + 1}] "${s.paper_title}" by ${authors}${page}\n${s.content}`;
    })
    .join("\n\n---\n\n");

  const historyText = history
    .slice(-6)
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  return `You are an expert academic research assistant helping with a literature review. 
You have been given excerpts from multiple research papers as context.

CRITICAL INSTRUCTIONS:
- Answer ONLY based on the provided paper excerpts below.
- You MUST cite the paper number (e.g. [1], [2]) after every claim you make.
- When comparing findings across papers, explicitly name which paper says what.
- If the answer cannot be found in the excerpts, say: "The provided papers do not contain enough information to answer this."
- Do not use any knowledge outside of the provided excerpts.

PAPER EXCERPTS:
${contextBlock}

${historyText ? `CONVERSATION HISTORY:\n${historyText}\n` : ""}
User: ${question}
Assistant:`;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body: ChatRequestBody = await req.json();
    const { projectId, question, history } = body;

    if (!projectId || !question?.trim()) {
      return new Response("Missing projectId or question", { status: 400 });
    }

    await connectToDatabase();

    // Verify ownership
    const project = await ProjectModel.findOne({
      _id: projectId,
      clerkUserId: userId,
    });
    if (!project) {
      return new Response("Project not found", { status: 404 });
    }

    // Check at least one paper is ready
    const readyCount = await PaperModel.countDocuments({
      projectId,
      clerkUserId: userId,
      status: "ready",
    });
    if (readyCount === 0) {
      return new Response(
        "No papers are ready yet. Please wait for ingestion to complete.",
        { status: 400 },
      );
    }

    // Get relevant chunks across all papers in this project
    const { sources } = await getRelevantChunks(question, projectId);

    const prompt = buildPrompt(sources, history, question);

    const ollamaRes = await fetch(
      `${process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434"}/api/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL ?? "llama3.2",
          prompt,
          stream: true,
        }),
      },
    );

    if (!ollamaRes.ok || !ollamaRes.body) {
      throw new Error(`Ollama failed: ${ollamaRes.status}`);
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = ollamaRes.body!.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const lines = decoder
              .decode(value, { stream: true })
              .split("\n")
              .filter(Boolean);

            for (const line of lines) {
              try {
                const json = JSON.parse(line);
                if (json.response) {
                  controller.enqueue(new TextEncoder().encode(json.response));
                }
                if (json.done) {
                  controller.close();
                  return;
                }
              } catch {
                // skip malformed lines
              }
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[API_CHAT]", error);
    return new Response("Internal server error", { status: 500 });
  }
}
