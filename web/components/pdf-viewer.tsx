"use client";

import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";

// Point react-pdf to the worker we copied into /public
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PdfViewerProps {
  fileUrl: string;
  title: string;
}

const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;

export function PdfViewer({ fileUrl, title }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1.0);
  const [pageInput, setPageInput] = useState<string>("1");
  const [loadState, setLoadState] = useState<"loading" | "success" | "error">(
    "loading",
  );

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setLoadState("success");
    },
    [],
  );

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error("[PDF_VIEWER]", error);
    setLoadState("error");
  }, []);

  const goToPage = (page: number) => {
    const clamped = Math.min(Math.max(1, page), numPages);
    setCurrentPage(clamped);
    setPageInput(String(clamped));
  };

  const handlePageInputBlur = () => {
    const parsed = parseInt(pageInput, 10);
    if (isNaN(parsed)) {
      setPageInput(String(currentPage));
    } else {
      goToPage(parsed);
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handlePageInputBlur();
  };

  const zoomIn = () =>
    setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)));
  const zoomOut = () =>
    setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)));

  return (
    <div className="flex flex-col h-full bg-muted/20">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-background/70 backdrop-blur-sm shrink-0">
        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1 || loadState !== "success"}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Input
              className="h-7 w-12 text-center text-xs px-1"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={handlePageInputBlur}
              onKeyDown={handlePageInputKeyDown}
              disabled={loadState !== "success"}
            />
            <span className="shrink-0">/ {numPages || "—"}</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= numPages || loadState !== "success"}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM || loadState !== "success"}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>

          <span className="text-xs text-muted-foreground w-12 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM || loadState !== "success"}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 min-w-0 ml-2">
          <p className="text-xs text-muted-foreground truncate">{title}</p>
        </div>
      </div>

      {/* ── PDF Canvas ── */}
      <div className="flex-1 overflow-auto flex justify-center py-6 px-4">
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Loading PDF…</p>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Failed to load PDF
                </p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  The file may have been moved or deleted. Try re-uploading.
                </p>
              </div>
            </div>
          }
          noData={
            <div className="flex flex-col items-center justify-center gap-3 py-24">
              <FileText className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No PDF to display</p>
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            scale={zoom}
            className="shadow-xl rounded-sm overflow-hidden"
            renderTextLayer={true} // enables text selection
            renderAnnotationLayer={true} // enables clickable links inside PDF
          />
        </Document>
      </div>

      {/* ── Bottom page indicator ── */}
      {loadState === "success" && (
        <div className="flex justify-center py-2 border-t border-border shrink-0">
          <p className="text-[11px] text-muted-foreground">
            Page {currentPage} of {numPages} ·{" "}
            <button
              onClick={() => goToPage(1)}
              className="hover:text-foreground transition-colors"
            >
              First
            </button>{" "}
            ·{" "}
            <button
              onClick={() => goToPage(numPages)}
              className="hover:text-foreground transition-colors"
            >
              Last
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
