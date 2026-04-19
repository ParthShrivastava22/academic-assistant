import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { ProjectModel } from "@/models/Project";
import { PaperModel } from "@/models/Paper";
import { WorkspaceClient } from "@/components/workspace-client";

async function getProjectWithPapers(projectId: string, userId: string) {
  await connectToDatabase();

  const project = await ProjectModel.findOne({
    _id: projectId,
    clerkUserId: userId,
  }).lean();

  if (!project) return null;

  const papers = await PaperModel.find({
    projectId,
    clerkUserId: userId,
  })
    .sort({ createdAt: -1 })
    .lean();

  return {
    id: project._id.toString(),
    title: project.title,
    description: project.description ?? "",
    papers: papers.map((p) => ({
      id: p._id.toString(),
      title: p.title,
      authors: p.authors,
      fileUrl: p.fileUrl,
      status: p.status as "processing" | "ready" | "error",
      chunkCount: p.chunkCount ?? 0,
      createdAt: p.createdAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    })),
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { projectId } = await params;

  let project;
  try {
    project = await getProjectWithPapers(projectId, userId);
  } catch {
    notFound();
  }

  if (!project) notFound();

  return <WorkspaceClient project={project} />;
}
