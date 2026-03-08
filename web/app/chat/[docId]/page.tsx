import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { DocumentModel } from "@/models/Document";
import { ChatPageClient } from "@/components/chat-page-client";

async function getDocument(docId: string, userId: string) {
  await connectToDatabase();

  const doc = await DocumentModel.findOne({
    _id: docId,
    clerkUserId: userId,
  }).lean();

  return doc ?? null;
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ docId: string }>; // 👈 now a Promise
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { docId } = await params; // 👈 await it before use

  let doc;
  try {
    doc = await getDocument(docId, userId);
  } catch {
    notFound();
  }

  if (!doc) notFound();

  return (
    <ChatPageClient docId={docId} docTitle={doc.title} fileUrl={doc.fileUrl} />
  );
}
