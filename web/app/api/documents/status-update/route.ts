import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DocumentModel } from "@/models/Document";

interface StatusUpdateBody {
  doc_id: string;
  status: "ready" | "error";
}

export async function POST(req: NextRequest) {
  try {
    // Verify it's coming from our FastAPI server, not a random caller
    const token = req.headers.get("x-internal-token");
    if (token !== process.env.INTERNAL_API_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: StatusUpdateBody = await req.json();
    const { doc_id, status } = body;

    if (!doc_id || !["ready", "error"].includes(status)) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    await connectToDatabase();

    await DocumentModel.findByIdAndUpdate(doc_id, { status });

    console.log(`[STATUS_UPDATE] doc ${doc_id} → ${status}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[STATUS_UPDATE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
