import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { ProjectModel } from "@/models/Project";
import { PaperModel } from "@/models/Paper";
import { DashboardClient } from "@/components/dashboard-client";

async function getUserProjects(userId: string) {
  await connectToDatabase();

  const projects = await ProjectModel.find({ clerkUserId: userId })
    .sort({ createdAt: -1 })
    .lean();

  return Promise.all(
    projects.map(async (project) => {
      const [paperCount, readyCount] = await Promise.all([
        PaperModel.countDocuments({ projectId: project._id }),
        PaperModel.countDocuments({ projectId: project._id, status: "ready" }),
      ]);

      return {
        id: project._id.toString(),
        title: project.title,
        description: project.description ?? "",
        paperCount,
        readyCount,
        createdAt: project.createdAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };
    }),
  );
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const projects = await getUserProjects(userId);

  return <DashboardClient projects={projects} />;
}
