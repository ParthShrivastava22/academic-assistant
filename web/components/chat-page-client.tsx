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
  FileText,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";

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

// Which panel is visible on mobile
type MobileTab = "pdf" | "chat";

export function ChatPageClient({
  docId,
  docTitle,
  fileUrl,
}: ChatPageClientProps) {
  const [pdfPanelOpen, setPdfPanelOpen] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* ── Top nav ── */}
      <header className="flex items-center gap-2 px-3 md:px-4 h-12 border-b border-border shrink-0 bg-background/90 backdrop-blur-md">
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

        <span className="text-muted-foreground/40 hidden sm:block">·</span>

        {/* Title — truncates gracefully on small screens */}
        <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">
          {docTitle}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Toggle PDF panel — desktop only */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hidden md:flex"
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

      {/* ── Mobile tab switcher ── */}
      <div className="flex md:hidden border-b border-border shrink-0 bg-background">
        <button
          onClick={() => setMobileTab("pdf")}
          className={`
            flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium
            border-b-2 transition-colors duration-150
            ${
              mobileTab === "pdf"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }
          `}
        >
          <FileText className="w-4 h-4" />
          PDF
        </button>
        <button
          onClick={() => setMobileTab("chat")}
          className={`
            flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium
            border-b-2 transition-colors duration-150
            ${
              mobileTab === "chat"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }
          `}
        >
          <MessageSquare className="w-4 h-4" />
          Chat
        </button>
      </div>

      {/* ── Content area ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT: PDF Viewer ──
            - Mobile: full width, shown only when mobileTab === "pdf"
            - Desktop: fixed 52% width, toggled by pdfPanelOpen button  */}
        <div
          className={`
            flex flex-col border-border min-w-0 overflow-hidden
            transition-all duration-200
            ${/* Mobile visibility */ mobileTab === "pdf" ? "flex" : "hidden"}
            md:flex                          
            ${
              /* Desktop visibility */
              pdfPanelOpen ? "md:w-[52%] md:border-r" : "md:w-0 md:hidden"
            }
          `}
        >
          <PdfViewer fileUrl={fileUrl} title={docTitle} />
        </div>

        {/* ── RIGHT: Chat ──
            - Mobile: full width, shown only when mobileTab === "chat"
            - Desktop: takes remaining space  */}
        <div
          className={`
            flex-col min-w-0 overflow-hidden
            ${mobileTab === "chat" ? "flex" : "hidden"}
            md:flex md:flex-1
          `}
        >
          <ChatWindow docId={docId} docTitle={docTitle} />
        </div>
      </div>
    </div>
  );
}
