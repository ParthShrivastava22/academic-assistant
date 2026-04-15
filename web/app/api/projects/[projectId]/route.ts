import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ProjectModel } from "@/models/Project";
import { PaperModel } from "@/models/Paper";
import { ChatSessionModel } from "@/models/ChatSession";
import { UTApi } from "uploadthing/server";

const utApi = new UTApi();

function extractFileKey(fileUrl: string): string | null {
  try {
    const parts = new URL(fileUrl).pathname.split("/");
    return parts[parts.length - 1] ?? null;
  } catch {
    return null;
  }
}

async function deleteFaissIndex(paperId: string) {
  try {
    await fetch(`${process.env.RAG_API_URL}/document/${paperId}`, {
      method: "DELETE",
      headers: {
        "x-internal-token": process.env.INTERNAL_API_SECRET!,
      },
    });
  } catch (err) {
    console.error(`[DELETE_FAISS] paper ${paperId}:`, err);
  }
}

// GET /api/projects/[projectId]
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

    const project = await ProjectModel.findOne({
      _id: projectId,
      clerkUserId: userId,
    }).lean();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const papers = await PaperModel.find({
      projectId,
      clerkUserId: userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      id: project._id.toString(),
      title: project.title,
      description: project.description,
      createdAt: project.createdAt,
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
    console.error("[PROJECT_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/projects/[projectId]
// Cascades: deletes all papers (UploadThing + FAISS) and chat sessions
export async function DELETE(
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

    // Verify ownership
    const project = await ProjectModel.findOne({
      _id: projectId,
      clerkUserId: userId,
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get all papers to clean up storage
    const papers = await PaperModel.find({ projectId, clerkUserId: userId });

    // Delete all three layers for every paper in parallel
    await Promise.allSettled(
      papers.map(async (paper) => {
        const paperId = paper._id.toString();

        await Promise.allSettled([
          // UploadThing CDN
          (async () => {
            const key = extractFileKey(paper.fileUrl);
            if (key) await utApi.deleteFiles(key);
          })(),
          // FAISS index on FastAPI
          deleteFaissIndex(paperId),
        ]);
      }),
    );

    // Delete MongoDB records
    await Promise.all([
      ProjectModel.findByIdAndDelete(projectId),
      PaperModel.deleteMany({ projectId }),
      ChatSessionModel.deleteMany({ projectId }),
    ]);

    return NextResponse.json({ success: true, projectId });
  } catch (error) {
    console.error("[PROJECT_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
