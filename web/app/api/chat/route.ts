import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DocumentModel } from "@/models/Document";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  docId: string;
  question: string;
  history: Message[]; // previous messages for context
}

// Fetches relevant chunks from FastAPI /query
async function getRelevantChunks(
  question: string,
  docId: string,
): Promise<string> {
  const ragApiUrl = process.env.RAG_API_URL;
  const secret = process.env.INTERNAL_API_SECRET;

  const res = await fetch(`${ragApiUrl}/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-token": secret!,
    },
    body: JSON.stringify({ doc_id: docId, question }),
  });

  if (!res.ok) {
    throw new Error(`FastAPI /query failed: ${res.status}`);
  }

  const data = await res.json();

  // Join chunks into a single context string, labelling each page
  return data.sources
    .map((s: { content: string; page: number | null }) =>
      s.page !== null ? `[Page ${s.page + 1}]\n${s.content}` : s.content,
    )
    .join("\n\n---\n\n");
}

// Builds the prompt sent to the LLM
function buildPrompt(
  context: string,
  history: Message[],
  question: string,
): string {
  const historyText = history
    .slice(-6) // only last 3 exchanges to keep prompt short
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  return `You are a helpful academic assistant. Answer questions based ONLY on the provided document context. If the answer is not in the context, say "I couldn't find that in the document."

DOCUMENT CONTEXT:
${context}

${historyText ? `CONVERSATION HISTORY:\n${historyText}\n` : ""}
User: ${question}
Assistant:`;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body: ChatRequestBody = await req.json();
    const { docId, question, history } = body;

    if (!docId || !question?.trim()) {
      return new Response("Missing docId or question", { status: 400 });
    }

    // 2. Verify the user owns this document
    await connectToDatabase();
    const doc = await DocumentModel.findOne({
      _id: docId,
      clerkUserId: userId,
    });

    if (!doc) {
      return new Response("Document not found", { status: 404 });
    }

    // 3. Get relevant chunks from FastAPI
    const context = await getRelevantChunks(question, docId);

    // 4. Build prompt
    const prompt = buildPrompt(context, history, question);

    // 5. Call Ollama and get a streaming response
    const ollamaUrl = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
    const ollamaModel = process.env.OLLAMA_MODEL ?? "llama3.2";

    const ollamaRes = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ollamaModel,
        prompt,
        stream: true,
      }),
    });

    if (!ollamaRes.ok || !ollamaRes.body) {
      throw new Error(`Ollama request failed: ${ollamaRes.status}`);
    }

    // 6. Transform Ollama's stream into a plain text stream for the client
    // Ollama sends newline-delimited JSON: { "response": "token", "done": false }
    // We extract just the text tokens and forward them
    const stream = new ReadableStream({
      async start(controller) {
        const reader = ollamaRes.body!.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });

            // Each chunk may contain multiple newline-delimited JSON objects
            const lines = chunk.split("\n").filter(Boolean);

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

    // Return as a plain text stream
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
