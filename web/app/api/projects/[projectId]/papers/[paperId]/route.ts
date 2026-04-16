import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { PaperModel } from "@/models/Paper";
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

export async function DELETE(
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
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    await Promise.allSettled([
      // MongoDB
      PaperModel.findByIdAndDelete(paperId),
      // UploadThing
      (async () => {
        const key = extractFileKey(paper.fileUrl);
        if (key) await utApi.deleteFiles(key);
      })(),
      // FAISS index
      // When deleting a single paper:
      fetch(
        `${process.env.RAG_API_URL}/project/${projectId}/paper/${paperId}`,
        {
          method: "DELETE",
          headers: { "x-internal-token": process.env.INTERNAL_API_SECRET! },
        },
      ),
    ]);

    return NextResponse.json({ success: true, paperId });
  } catch (error) {
    console.error("[PAPER_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
