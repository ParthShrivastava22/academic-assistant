"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FileText,
  MoreVertical,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { Paper } from "@/components/workspace-client";

interface PaperItemProps {
  paper: Paper;
  projectId: string;
  isSelected: boolean;
  onSelect: () => void;
  onDeleted: () => void;
  onReady: () => void;
}

export function PaperItem({
  paper,
  projectId,
  isSelected,
  onSelect,
  onDeleted,
  onReady,
}: PaperItemProps) {
  const [status, setStatus] = useState(paper.status);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Poll for status while processing
  useEffect(() => {
    if (status !== "processing") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/projects/${projectId}/papers/${paper.id}/status`,
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.status !== "processing") {
          setStatus(data.status);
          clearInterval(interval);
          if (data.status === "ready") onReady();
        }
      } catch {
        // ignore blips
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [status, paper.id, projectId, onReady]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await fetch(`/api/projects/${projectId}/papers/${paper.id}`, {
        method: "DELETE",
      });
      setConfirmOpen(false);
      onDeleted();
    } catch (err) {
      console.error("[PAPER_DELETE]", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const statusIcon = {
    ready: <CheckCircle2 className="w-3 h-3 text-green-600 shrink-0" />,
    processing: (
      <Loader2 className="w-3 h-3 text-yellow-600 animate-spin shrink-0" />
    ),
    error: <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />,
  }[status];

  return (
    <>
      <div
        onClick={status === "ready" ? onSelect : undefined}
        className={`
          group flex items-start gap-2.5 rounded-lg px-3 py-2.5 transition-colors
          ${status === "ready" ? "cursor-pointer hover:bg-muted/60" : "cursor-default opacity-80"}
          ${isSelected ? "bg-primary/8 border border-primary/20" : "border border-transparent"}
        `}
      >
        <FileText
          className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
        />

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight">
            {paper.title}
          </p>
          {paper.authors.length > 0 && (
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {paper.authors.join(", ")}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-1.5">
            {statusIcon}
            <span className="text-[10px] text-muted-foreground capitalize">
              {status === "processing" ? "Processing…" : status}
            </span>
            {status === "ready" && paper.chunkCount > 0 && (
              <span className="text-[10px] text-muted-foreground">
                · {paper.chunkCount} chunks
              </span>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive gap-2"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmOpen(true);
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete paper
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete paper?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{paper.title}</span>{" "}
              will be permanently removed from this project.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
