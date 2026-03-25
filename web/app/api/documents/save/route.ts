import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DocumentModel } from "@/models/Document";

interface SaveDocumentBody {
  title: string;
  fileUrl: string;
}

// Calls the FastAPI /ingest endpoint in the background
async function triggerIngestion(docId: string, fileUrl: string) {
  const ragApiUrl = process.env.RAG_API_URL;
  const secret = process.env.INTERNAL_API_SECRET;

  if (!ragApiUrl || !secret) {
    console.error("[INGEST] RAG_API_URL or INTERNAL_API_SECRET missing");
    return;
  }

  try {
    // FastAPI returns 202 immediately — ingestion runs in its background
    const response = await fetch(`${ragApiUrl}/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-token": secret,
      },
      body: JSON.stringify({
        doc_id: docId,
        file_url: fileUrl,
      }),
    });

    if (!response.ok) {
      console.error("[INGEST] FastAPI rejected the request:", response.status);
    }
  } catch (err) {
    console.error("[INGEST] Failed to reach FastAPI server:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: SaveDocumentBody = await req.json();
    const { title, fileUrl } = body;

    if (!title || !fileUrl) {
      return NextResponse.json(
        { error: "Missing required fields: title and fileUrl" },
        { status: 400 },
      );
    }

    if (!fileUrl.startsWith("https://")) {
      return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
    }

    await connectToDatabase();

    // Save metadata — status starts as "processing"
    const newDocument = await DocumentModel.create({
      title: title.trim(),
      fileUrl,
      clerkUserId: userId,
      status: "processing",
    });

    const docId = newDocument._id.toString();

    // Fire ingestion in the background — don't await it
    // The upload dialog closes immediately, status flips to
    // "ready" (or "error") on the dashboard once ingestion completes
    triggerIngestion(docId, fileUrl);

    return NextResponse.json(
      {
        success: true,
        document: {
          id: docId,
          title: newDocument.title,
          fileUrl: newDocument.fileUrl,
          status: newDocument.status,
          createdAt: newDocument.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[DOCUMENTS_SAVE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
