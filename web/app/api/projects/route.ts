import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ProjectModel } from "@/models/Project";
import { PaperModel } from "@/models/Paper";

// GET /api/projects — fetch all projects for the logged-in user
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const projects = await ProjectModel.find({ clerkUserId: userId })
      .sort({ createdAt: -1 })
      .lean();

    // Attach paper counts so the dashboard can show "5 papers" per project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const paperCount = await PaperModel.countDocuments({
          projectId: project._id,
          clerkUserId: userId,
        });
        const readyCount = await PaperModel.countDocuments({
          projectId: project._id,
          clerkUserId: userId,
          status: "ready",
        });
        return {
          id: project._id.toString(),
          title: project.title,
          description: project.description,
          paperCount,
          readyCount,
          createdAt: project.createdAt,
        };
      }),
    );

    return NextResponse.json({ projects: projectsWithCounts });
  } catch (error) {
    console.error("[PROJECTS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/projects — create a new project
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description } = await req.json();

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Project title is required" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const project = await ProjectModel.create({
      title: title.trim(),
      description: description?.trim() ?? "",
      clerkUserId: userId,
    });

    return NextResponse.json(
      {
        id: project._id.toString(),
        title: project.title,
        description: project.description,
        createdAt: project.createdAt,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[PROJECTS_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
