import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { PaperModel } from "@/models/Paper";

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
