"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Layers,
  ArrowRight,
  MoreVertical,
  Trash2,
  Loader2,
  Clock,
} from "lucide-react";

export interface Project {
  id: string;
  title: string;
  description: string;
  paperCount: number;
  readyCount: number;
  createdAt: string;
}

interface ProjectCardProps {
  project: Project;
  onDeleted: () => void;
}

export function ProjectCard({ project, onDeleted }: ProjectCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      setConfirmOpen(false);
      onDeleted();
    } catch (err) {
      console.error("[PROJECT_DELETE]", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const allReady =
    project.paperCount > 0 && project.readyCount === project.paperCount;
  const someReady = project.readyCount > 0;

  return (
    <>
      <Card className="group relative hover:shadow-md hover:border-primary/30 transition-all duration-200 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/60 to-accent/60 opacity-0 group-hover:opacity-100 transition-opacity" />

        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive gap-2"
                  onClick={() => setConfirmOpen(true)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <h3 className="font-semibold text-sm text-foreground leading-tight mb-1 line-clamp-2">
            {project.title}
          </h3>

          {project.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {project.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-3">
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Layers className="w-2.5 h-2.5" />
              {project.paperCount} paper{project.paperCount !== 1 ? "s" : ""}
            </Badge>
            {project.paperCount > 0 && (
              <Badge
                variant="outline"
                className={`text-[10px] ${
                  allReady
                    ? "text-green-700 border-green-200 bg-green-50"
                    : someReady
                      ? "text-yellow-700 border-yellow-200 bg-yellow-50"
                      : "text-muted-foreground"
                }`}
              >
                {project.readyCount}/{project.paperCount} ready
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="px-5 py-3 border-t border-border flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            {project.createdAt}
          </span>
          <Link href={`/project/${project.id}`}>
            <Button size="sm" className="h-7 text-xs gap-1.5">
              Open
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </CardFooter>
      </Card>

      {/* Delete confirmation */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">
                {project.title}
              </span>{" "}
              and all {project.paperCount} paper
              {project.paperCount !== 1 ? "s" : ""}, their files, and chat
              history will be permanently deleted.
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
              {isDeleting ? "Deleting…" : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
