"use client";

import { useEffect, useState } from "react";
import { Copy, Download, Trash2, Pencil, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useBom } from "@/features/bom/store";
import {
  updateProject,
  deleteProject,
} from "@/lib/apis/project/client";
import { VisibilityBadge } from "@/components/VisibilityBadge";
import { CopyProjectModal } from "@/components/CopyProjectModal";

interface ProjectSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    id: string;
    name: string;
    isPublic: boolean;
    isOwner: boolean;
    authorAlias?: string;
  };
  pdfUrl: string | null;
  onProjectsChanged: () => Promise<void> | void;
  onOpenPreview: () => void;
}

export function ProjectSettingsModal({
  open,
  onOpenChange,
  project,
  pdfUrl,
  onProjectsChanged,
  onOpenPreview,
}: ProjectSettingsModalProps) {
  const router = useRouter();
  const { loadProject, clearProject } = useBom();

  const [name, setName] = useState(project.name);
  const [pendingPublic, setPendingPublic] = useState(project.isPublic);
  const [alias, setAlias] = useState(project.authorAlias ?? "");
  const [editingName, setEditingName] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isCopyOpen, setIsCopyOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setName(project.name);
      setPendingPublic(project.isPublic);
      setAlias(project.authorAlias ?? "");
      setEditingName(false);
    }
  }, [open, project.name, project.isPublic, project.authorAlias]);

  const dirty =
    name !== project.name ||
    pendingPublic !== project.isPublic ||
    alias !== (project.authorAlias ?? "");

  const handleSave = async () => {
    if (!project.isOwner || !dirty) return;
    setBusy(true);
    try {
      await updateProject(project.id, {
        name: name.trim(),
        isPublic: pendingPublic,
        authorAlias: alias.trim(),
      });
      await onProjectsChanged();
      await loadProject(name.trim());
      toast.success("Project settings saved");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!project.isOwner) return;
    setBusy(true);
    try {
      await deleteProject(project.id);
      clearProject();
      await onProjectsChanged();
      onOpenChange(false);
      router.push("/bom");
      toast.success("Project deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete project");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Header — divider + slightly different bg, full-bleed to modal edges */}
        <DialogHeader className="-mx-4 -mt-4 flex min-w-0 flex-row items-center gap-3 rounded-t-xl border-b border-border/60 bg-muted/50 px-4 pt-3 pb-3 pr-10">
          {editingName ? (
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setEditingName(false);
              }}
              className="h-8 min-w-0 flex-1"
            />
          ) : (
              <DialogTitle
                className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-sm"
                title={name}
              >
              {name}
            </DialogTitle>
          )}
          {!editingName && project.isOwner && (
            <button
              type="button"
              onClick={() => setEditingName(true)}
              title="Rename"
              className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              <Pencil size={14} />
            </button>
          )}
          <VisibilityBadge isPublic={pendingPublic} />
        </DialogHeader>

        <div className="flex min-w-0 flex-col gap-5">
          {/* Visibility + author alias */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Visibility
            </h3>
            {!project.isOwner && (
              <p className="mb-2 text-[11px] text-muted-foreground">
                Only the owner can change visibility.
              </p>
            )}
            <RadioGroup
              value={pendingPublic ? "public" : "private"}
              onValueChange={(v) => setPendingPublic(v === "public")}
              disabled={!project.isOwner}
              className={cn(
                "flex gap-4",
                !project.isOwner && "opacity-50",
              )}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="private" id="vis-private" />
                <Label htmlFor="vis-private" className="cursor-pointer">
                  Private
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="public" id="vis-public" />
                <Label htmlFor="vis-public" className="cursor-pointer">
                  Public
                </Label>
              </div>
            </RadioGroup>

            <div className="mt-3">
              <Label
                htmlFor="author-alias"
                className="mb-1 block text-xs text-muted-foreground"
              >
                Author alias
              </Label>
              <Input
                id="author-alias"
                value={alias}
                disabled={!project.isOwner}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Display name shown instead of username"
                className={cn(!project.isOwner && "opacity-50")}
              />
            </div>
          </section>

          {/* Actions */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Actions
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCopyOpen(true)}
                disabled={busy}
              >
                <Copy size={16} className="mr-2" />
                Copy
              </Button>
              {project.isOwner && (
                <Button
                  variant="destructive"
                  onClick={() => setIsDeleteOpen(true)}
                  disabled={busy}
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </section>

          {/* Specs report */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Specs report
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                className={cn(!pdfUrl && "pointer-events-none opacity-50")}
              >
                <a href={pdfUrl || "#"} download={`${project.name}_Report.pdf`}>
                  <Download size={16} />
                  Download
                </a>
              </Button>
              <Button
                variant="outline"
                onClick={onOpenPreview}
                disabled={!pdfUrl}
              >
                <Eye size={16} className="mr-2" />
                Preview
              </Button>
            </div>
          </section>
        </div>

        {/* Footer — Cancel / Save (no autosave), full-bleed to modal edges */}
        <DialogFooter className="flex min-w-0 flex-row items-center gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!project.isOwner || !dirty || busy}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <CopyProjectModal
      open={isCopyOpen}
      onOpenChange={setIsCopyOpen}
      projectId={project.id}
      defaultName={`Copy of ${project.name}`}
      onCopied={async (name) => {
        await onProjectsChanged();
        await loadProject(name);
        onOpenChange(false);
      }}
    />

    <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete project</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This action cannot be undone. The project and all its components will
          be permanently removed.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setIsDeleteOpen(false);
              handleDelete();
            }}
          >
            <Trash2 size={16} className="mr-2" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
