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
import { PdfViewerDynamic as PdfViewer } from "@/components/pdf-viewer-dynamic";
import {
  Microscope,
  ChevronLeft,
  Plus,
  FileText,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  BookOpen,
} from "lucide-react";

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

type LeftTab = "papers" | "viewer";

interface WorkspaceClientProps {
  project: ProjectData;
}

export function WorkspaceClient({ project }: WorkspaceClientProps) {
  const router = useRouter();
  const [papers, setPapers] = useState<Paper[]>(project.papers);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [leftTab, setLeftTab] = useState<LeftTab>("papers");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);

  const readyCount = papers.filter((p) => p.status === "ready").length;

  const handlePaperUploaded = (newPaper: Paper) => {
    setPapers((prev) => [newPaper, ...prev]);
  };

  const handlePaperDeleted = (paperId: string) => {
    setPapers((prev) => prev.filter((p) => p.id !== paperId));
    if (selectedPaper?.id === paperId) {
      setSelectedPaper(null);
      setLeftTab("papers");
    }
  };

  const handlePaperReady = (paperId: string) => {
    setPapers((prev) =>
      prev.map((p) => (p.id === paperId ? { ...p, status: "ready" } : p)),
    );
  };

  // When a paper is clicked, select it and switch to viewer tab
  const handlePaperSelect = (paper: Paper) => {
    if (selectedPaper?.id === paper.id && leftTab === "viewer") {
      // Clicking the same paper on viewer tab → deselect
      setSelectedPaper(null);
      setLeftTab("papers");
    } else {
      setSelectedPaper(paper);
      setLeftTab("viewer");
    }
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
            <Microscope className="w-3 h-3 text-primary-foreground" />
          </div>
          <span
            className="text-sm font-semibold hidden sm:block"
            style={{ fontFamily: "var(--font-crimson)" }}
          >
            ScholarAI
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
            title={leftPanelOpen ? "Hide panel" : "Show panel"}
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
        {/* ── LEFT PANEL ── */}
        {leftPanelOpen && (
          <div className="w-[400px] shrink-0 flex flex-col border-r border-border bg-muted/10 overflow-hidden">
            {/* ── Tab bar ── */}
            <div className="flex border-b border-border shrink-0 bg-background">
              {/* Papers tab */}
              <button
                onClick={() => setLeftTab("papers")}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium
                  border-b-2 transition-colors duration-150
                  ${
                    leftTab === "papers"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                <FileText className="w-3.5 h-3.5" />
                Papers
                {papers.length > 0 && (
                  <span
                    className={`
                    text-[10px] rounded-full px-1.5 py-0.5 font-medium
                    ${
                      leftTab === "papers"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }
                  `}
                  >
                    {papers.length}
                  </span>
                )}
              </button>

              {/* Viewer tab */}
              <button
                onClick={() => {
                  if (!selectedPaper) return; // can't switch without a selected paper
                  setLeftTab("viewer");
                }}
                disabled={!selectedPaper}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium
                  border-b-2 transition-colors duration-150
                  ${
                    !selectedPaper
                      ? "border-transparent text-muted-foreground/40 cursor-not-allowed"
                      : leftTab === "viewer"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                <BookOpen className="w-3.5 h-3.5" />
                PDF Viewer
                {selectedPaper && (
                  <span
                    className={`
                    text-[10px] rounded-full px-1.5 py-0.5 font-medium max-w-[80px] truncate
                    ${
                      leftTab === "viewer"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }
                  `}
                  >
                    {selectedPaper.title.split(":")[0]}
                  </span>
                )}
              </button>
            </div>

            {/* ── Papers tab content ── */}
            <div
              className={
                leftTab === "papers"
                  ? "flex flex-col flex-1 min-h-0 overflow-hidden"
                  : "hidden"
              }
            >
              {/* Library header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <div>
                  <p className="text-xs font-semibold text-foreground">
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
                        onSelect={() => handlePaperSelect(paper)}
                        onDeleted={() => handlePaperDeleted(paper.id)}
                        onReady={() => handlePaperReady(paper.id)}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Hint when a paper is selected */}
              {selectedPaper && (
                <div
                  className="px-4 py-2.5 border-t border-border bg-primary/5 shrink-0 cursor-pointer hover:bg-primary/8 transition-colors"
                  onClick={() => setLeftTab("viewer")}
                >
                  <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3" />
                    View &ldquo;
                    {selectedPaper.title.length > 35
                      ? selectedPaper.title.slice(0, 35) + "…"
                      : selectedPaper.title}
                    &rdquo; →
                  </p>
                </div>
              )}
            </div>

            {/* ── Viewer tab content ──
    ALWAYS mounted, shown/hidden via CSS only.
    This prevents PdfViewer from unmounting on tab switch,
    which was causing the blinking. ── */}
            <div
              className={
                leftTab === "viewer" && selectedPaper
                  ? "flex flex-col flex-1 min-h-0 overflow-hidden"
                  : "hidden"
              }
            >
              {/* Viewer sub-header */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0 bg-background/60">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground px-2"
                  onClick={() => setLeftTab("papers")}
                >
                  <ChevronLeft className="w-3 h-3" />
                  Papers
                </Button>
                <span className="text-muted-foreground/40 text-xs">/</span>
                <span className="text-xs text-foreground font-medium truncate flex-1 min-w-0">
                  {selectedPaper?.title}
                </span>
              </div>

              {/* PdfViewer — stays mounted permanently once first rendered */}
              <div className="flex-1 min-h-0 overflow-hidden">
                {selectedPaper && (
                  <PdfViewer
                    fileUrl={selectedPaper.fileUrl}
                    title={selectedPaper.title}
                  />
                )}
              </div>
            </div>

            {/* No paper selected on viewer tab — safety fallback */}
            {leftTab === "viewer" && !selectedPaper && (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                No paper selected
              </div>
            )}

            {/* ── Viewer tab content ── */}
            {leftTab === "viewer" && selectedPaper && (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Viewer sub-header */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0 bg-background/60">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground px-2"
                    onClick={() => setLeftTab("papers")}
                  >
                    <ChevronLeft className="w-3 h-3" />
                    Papers
                  </Button>
                  <span className="text-muted-foreground/40 text-xs">/</span>
                  <span className="text-xs text-foreground font-medium truncate flex-1 min-w-0">
                    {selectedPaper.title}
                  </span>
                </div>

                {/* Full-height PDF viewer */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <PdfViewer
                    fileUrl={selectedPaper.fileUrl}
                    title={selectedPaper.title}
                  />
                </div>
              </div>
            )}

            {/* ── Viewer tab: no paper selected (shouldn't happen but safety) ── */}
            {leftTab === "viewer" && !selectedPaper && (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                No paper selected
              </div>
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
