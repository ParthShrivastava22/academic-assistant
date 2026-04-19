"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing/core";
import { CheckCircle2, AlertCircle, Loader2, Plus, X } from "lucide-react";
import type { Paper } from "@/components/workspace-client";

interface UploadPaperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onUploaded: (paper: Paper) => void;
}

type DialogState = "form" | "uploading" | "saving" | "success" | "error";

export function UploadPaperDialog({
  open,
  onOpenChange,
  projectId,
  onUploaded,
}: UploadPaperDialogProps) {
  const [state, setState] = useState<DialogState>("form");
  const [title, setTitle] = useState("");
  const [authorInput, setAuthorInput] = useState("");
  const [authors, setAuthors] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addAuthor = () => {
    const trimmed = authorInput.trim();
    if (trimmed && !authors.includes(trimmed)) {
      setAuthors((prev) => [...prev, trimmed]);
      setAuthorInput("");
    }
  };

  const removeAuthor = (name: string) => {
    setAuthors((prev) => prev.filter((a) => a !== name));
  };

  const handleClose = () => {
    if (state === "saving" || state === "uploading") return;
    setState("form");
    setTitle("");
    setAuthorInput("");
    setAuthors([]);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a Paper</DialogTitle>
          <DialogDescription>
            Enter the paper details, then upload the PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {/* ── Success ── */}
          {state === "success" && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Paper added!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Processing in the background. It will be ready shortly.
                </p>
              </div>
              <Button onClick={handleClose}>Done</Button>
            </div>
          )}

          {/* ── Saving ── */}
          {state === "saving" && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Saving paper…</p>
            </div>
          )}

          {/* ── Error ── */}
          {state === "error" && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-red-600" />
              </div>
              <div>
                <p className="font-medium">Upload failed</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {error ?? "Something went wrong."}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setState("form");
                  setError(null);
                }}
              >
                Try again
              </Button>
            </div>
          )}

          {/* ── Form + Dropzone ── */}
          {(state === "form" || state === "uploading") && (
            <>
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Paper title <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. Attention Is All You Need"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={state === "uploading"}
                />
              </div>

              {/* Authors */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Authors{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Vaswani, A."
                    value={authorInput}
                    onChange={(e) => setAuthorInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addAuthor()}
                    disabled={state === "uploading"}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addAuthor}
                    disabled={!authorInput.trim() || state === "uploading"}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {authors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {authors.map((a) => (
                      <span
                        key={a}
                        className="flex items-center gap-1 text-xs bg-muted rounded-full px-2.5 py-1"
                      >
                        {a}
                        <button
                          onClick={() => removeAuthor(a)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* UploadThing dropzone */}
              <UploadDropzone<OurFileRouter, "pdfUploader">
                endpoint="pdfUploader"
                appearance={{
                  container:
                    "border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-all duration-200",
                  label: "text-sm font-medium text-foreground",
                  allowedContent: "text-xs text-muted-foreground mt-1",
                  button:
                    "bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors",
                }}
                content={{
                  label: !title.trim()
                    ? "Enter a title above first"
                    : "Drag & drop PDF or click to browse",
                  allowedContent: "PDF only · up to 32 MB",
                }}
                disabled={!title.trim()}
                onUploadBegin={() => setState("uploading")}
                onClientUploadComplete={async (res) => {
                  const file = res[0];
                  if (!file) return;

                  setState("saving");

                  try {
                    const response = await fetch(
                      `/api/projects/${projectId}/papers`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          title: title.trim(),
                          authors,
                          fileUrl: file.url,
                        }),
                      },
                    );

                    if (!response.ok) {
                      const data = await response.json();
                      throw new Error(data.error ?? "Failed to save paper");
                    }

                    const paper = await response.json();
                    onUploaded(paper);
                    setState("success");
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Failed to save paper",
                    );
                    setState("error");
                  }
                }}
                onUploadError={(err) => {
                  setError(err.message);
                  setState("error");
                }}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
