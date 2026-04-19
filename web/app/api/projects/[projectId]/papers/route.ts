import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ProjectModel } from "@/models/Project";
import { PaperModel } from "@/models/Paper";

async function triggerIngestion(
  paperId: string,
  fileUrl: string,
  title: string,
  authors: string[],
  projectId: string, // ← make sure this parameter exists
) {
  const ragApiUrl = process.env.RAG_API_URL;
  const secret = process.env.INTERNAL_API_SECRET;

  if (!ragApiUrl || !secret) return;

  const payload = {
    doc_id: paperId,
    project_id: projectId,
    file_url: fileUrl,
    paper_title: title,
    authors,
  };

  // Temporary — remove after debugging
  console.log("[INGEST_PAYLOAD]", JSON.stringify(payload, null, 2));

  try {
    await fetch(`${ragApiUrl}/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-token": secret,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("[INGEST_TRIGGER]", err);
  }
}

// GET /api/projects/[projectId]/papers
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    await connectToDatabase();

    const papers = await PaperModel.find({ projectId, clerkUserId: userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      papers: papers.map((p) => ({
        id: p._id.toString(),
        title: p.title,
        authors: p.authors,
        fileUrl: p.fileUrl,
        status: p.status,
        chunkCount: p.chunkCount,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error("[PAPERS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/projects/[projectId]/papers
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const { title, authors, fileUrl } = await req.json();

    if (!title?.trim() || !fileUrl) {
      return NextResponse.json(
        { error: "title and fileUrl are required" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // Verify the project belongs to this user
    const project = await ProjectModel.findOne({
      _id: projectId,
      clerkUserId: userId,
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const paper = await PaperModel.create({
      projectId,
      clerkUserId: userId,
      title: title.trim(),
      authors: authors ?? [],
      fileUrl,
      status: "processing",
    });

    const paperId = paper._id.toString();

    // Fire ingestion — FastAPI returns 202 immediately
    triggerIngestion(paperId, fileUrl, paper.title, paper.authors, projectId);

    return NextResponse.json(
      {
        id: paperId,
        title: paper.title,
        authors: paper.authors,
        fileUrl: paper.fileUrl,
        status: paper.status,
        createdAt: paper.createdAt,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[PAPERS_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
