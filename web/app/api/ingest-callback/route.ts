import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { PaperModel } from "@/models/Paper";

interface IngestCallbackBody {
  doc_id: string;
  status: "ready" | "error";
  chunk_count?: number;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string; paperId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, paperId } = await params;
    await connectToDatabase();

    const paper = await PaperModel.findOne({
      _id: paperId,
      projectId,
      clerkUserId: userId,
    }).select("status chunkCount");

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: paper.status,
      chunkCount: paper.chunkCount,
    });
  } catch (error) {
    console.error("[PAPER_STATUS]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("x-internal-token");
    if (token !== process.env.INTERNAL_API_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: IngestCallbackBody = await req.json();
    const { doc_id, status, chunk_count } = body;

    if (!doc_id || !["ready", "error"].includes(status)) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    await connectToDatabase();

    await PaperModel.findByIdAndUpdate(doc_id, {
      status,
      ...(chunk_count !== undefined && { chunkCount: chunk_count }),
    });

    console.log(
      `[INGEST_CALLBACK] paper ${doc_id} → ${status} (${chunk_count} chunks)`,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[INGEST_CALLBACK]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
