"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PdfViewerProps {
  fileUrl: string;
  title: string;
}

const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2.5;

export function PdfViewer({ fileUrl, title }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1.0);
  const [pageInput, setPageInput] = useState<string>("1");
  const [loadState, setLoadState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [containerWidth, setContainerWidth] = useState<number>(500);
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure the container width so we can fit the page to it
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(width);
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setLoadState("success");
      // Reset to page 1 and fit-width zoom when a new doc loads
      setCurrentPage(1);
      setPageInput("1");
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
    if (isNaN(parsed)) setPageInput(String(currentPage));
    else goToPage(parsed);
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handlePageInputBlur();
  };

  const zoomIn = () =>
    setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)));
  const zoomOut = () =>
    setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)));

  // The actual pixel width passed to <Page> — fits container, scaled by zoom
  const pageWidth = Math.floor(containerWidth * zoom);

  return (
    <div className="flex flex-col h-full bg-muted/20">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-border bg-background/70 backdrop-blur-sm shrink-0 flex-wrap">
        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1 || loadState !== "success"}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Input
              className="h-6 w-10 text-center text-xs px-1"
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
            className="h-6 w-6"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= numPages || loadState !== "success"}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="w-px h-3.5 bg-border mx-0.5" />

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM || loadState !== "success"}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>

          <span className="text-xs text-muted-foreground w-10 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM || loadState !== "success"}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Fit-width button */}
        <Button
          variant="ghost"
          className="h-6 text-xs px-2 ml-auto"
          onClick={() => setZoom(1.0)}
          disabled={loadState !== "success"}
        >
          Fit
        </Button>
      </div>

      {/* ── PDF Canvas ── */}
      <div ref={containerRef} className="flex-1 min-h-0 overflow-auto">
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Loading PDF…</p>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">
                  Failed to load PDF
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  The file may have been moved or deleted.
                </p>
              </div>
            </div>
          }
          noData={
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <FileText className="w-7 h-7 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No PDF selected</p>
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            // Width fills the container, zoom scales on top of that
            width={pageWidth}
            className="shadow-md"
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>

      {/* ── Bottom indicator ── */}
      {loadState === "success" && (
        <div className="flex justify-center py-1.5 border-t border-border shrink-0">
          <p className="text-[10px] text-muted-foreground">
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
