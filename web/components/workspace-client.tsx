"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ChatWindow } from "@/components/chat-window";
import { PaperItem } from "@/components/paper-item";
import { UploadPaperDialog } from "@/components/upload-paper-dialog";
import {
  BookOpen,
  ChevronLeft,
  Plus,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const PdfViewer = dynamic(
  () => import("@/components/pdf-viewer").then((m) => m.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Loading viewer…
      </div>
    ),
  },
);

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  fileUrl: string;
  status: "processing" | "ready" | "error";
  chunkCount: number;
  createdAt: string;
}

export interface ProjectData {
  id: string;
  title: string;
  description: string;
  papers: Paper[];
}

interface WorkspaceClientProps {
  project: ProjectData;
}

export function WorkspaceClient({ project }: WorkspaceClientProps) {
  const router = useRouter();
  const [papers, setPapers] = useState<Paper[]>(project.papers);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);

  const readyCount = papers.filter((p) => p.status === "ready").length;

  const handlePaperUploaded = (newPaper: Paper) => {
    setPapers((prev) => [newPaper, ...prev]);
  };

  const handlePaperDeleted = (paperId: string) => {
    setPapers((prev) => prev.filter((p) => p.id !== paperId));
    if (selectedPaper?.id === paperId) setSelectedPaper(null);
  };

  const handlePaperReady = (paperId: string) => {
    setPapers((prev) =>
      prev.map((p) => (p.id === paperId ? { ...p, status: "ready" } : p)),
    );
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* ── Top nav ── */}
      <header className="flex items-center gap-2 px-4 h-12 border-b border-border shrink-0 bg-background/90 backdrop-blur-md">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <BookOpen className="w-3 h-3 text-primary-foreground" />
          </div>
          <span
            className="text-sm font-semibold hidden sm:block"
            style={{ fontFamily: "var(--font-crimson)" }}
          >
            Lexis
          </span>
        </div>
        <span className="text-muted-foreground/40">·</span>
        <span className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
          {project.title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setLeftPanelOpen((v) => !v)}
            title={leftPanelOpen ? "Hide paper panel" : "Show paper panel"}
          >
            {leftPanelOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </Button>
          <UserButton />
        </div>
      </header>

      {/* ── Workspace body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT PANEL: Paper library + PDF viewer ── */}
        {leftPanelOpen && (
          <div className="w-[420px] shrink-0 flex flex-col border-r border-border bg-muted/10 overflow-hidden">
            {/* Paper library header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Paper Library
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {readyCount}/{papers.length} ready for synthesis
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1.5"
                onClick={() => setUploadOpen(true)}
              >
                <Plus className="w-3 h-3" />
                Add paper
              </Button>
            </div>

            {/* Paper list */}
            <ScrollArea className="flex-1">
              {papers.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      No papers yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload research papers to start synthesizing.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1.5 mt-1"
                    onClick={() => setUploadOpen(true)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Upload first paper
                  </Button>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {papers.map((paper) => (
                    <PaperItem
                      key={paper.id}
                      paper={paper}
                      projectId={project.id}
                      isSelected={selectedPaper?.id === paper.id}
                      onSelect={() =>
                        setSelectedPaper(
                          selectedPaper?.id === paper.id ? null : paper,
                        )
                      }
                      onDeleted={() => handlePaperDeleted(paper.id)}
                      onReady={() => handlePaperReady(paper.id)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* PDF viewer panel */}
            {selectedPaper && (
              <>
                <Separator />
                <div className="h-[420px] shrink-0 flex flex-col">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
                    <p className="text-xs font-medium text-foreground truncate max-w-[260px]">
                      {selectedPaper.title}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => setSelectedPaper(null)}
                    >
                      ✕
                    </Button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <PdfViewer
                      fileUrl={selectedPaper.fileUrl}
                      title={selectedPaper.title}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── RIGHT PANEL: Synthesis chat ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <ChatWindow
            projectId={project.id}
            projectTitle={project.title}
            readyPaperCount={readyCount}
          />
        </div>
      </div>

      <UploadPaperDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        projectId={project.id}
        onUploaded={handlePaperUploaded}
      />
    </div>
  );
}
