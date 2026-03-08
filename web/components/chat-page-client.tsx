"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ChatWindow } from "@/components/chat-window";
import {
  BookOpen,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useState } from "react";

// Dynamically import PdfViewer — disables SSR for this component
// because pdf.js requires browser APIs (window, canvas, etc.)
const PdfViewer = dynamic(
  () => import("@/components/pdf-viewer").then((mod) => mod.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Loading viewer…</p>
      </div>
    ),
  },
);

interface ChatPageClientProps {
  docId: string;
  docTitle: string;
  fileUrl: string;
}

export function ChatPageClient({ docTitle, fileUrl }: ChatPageClientProps) {
  const [pdfPanelOpen, setPdfPanelOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* ── Top nav ── */}
      <header className="flex items-center gap-3 px-4 h-12 border-b border-border shrink-0 bg-background/90 backdrop-blur-md">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </Link>

        <div className="flex items-center gap-2">
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
        <span className="text-xs text-muted-foreground truncate max-w-xs">
          {docTitle}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPdfPanelOpen(!pdfPanelOpen)}
            title={pdfPanelOpen ? "Hide PDF panel" : "Show PDF panel"}
          >
            {pdfPanelOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </Button>
          <UserButton />
        </div>
      </header>

      {/* ── Split pane ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: PDF Viewer */}
        {pdfPanelOpen && (
          <div className="w-[52%] flex flex-col border-r border-border min-w-0">
            <PdfViewer fileUrl={fileUrl} title={docTitle} />
          </div>
        )}

        {/* Right: Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatWindow docTitle={docTitle} />
        </div>
      </div>
    </div>
  );
}
