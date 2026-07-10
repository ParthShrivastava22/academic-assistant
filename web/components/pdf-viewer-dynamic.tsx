import dynamic from "next/dynamic";

// This is created exactly once at module load time — never re-created
export const PdfViewerDynamic = dynamic(
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
