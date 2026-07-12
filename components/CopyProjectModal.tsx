"use client";

import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copyProject } from "@/lib/apis/project/client";
import { toast } from "sonner";

interface CopyProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  defaultName: string;
  onCopied?: (name: string, id: string) => void;
}

export function CopyProjectModal({
  open,
  onOpenChange,
  projectId,
  defaultName,
  onCopied,
}: CopyProjectModalProps) {
  const [name, setName] = useState(defaultName);
  const [isPublic, setIsPublic] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (open) {
      setName(defaultName);
      setIsPublic(false);
    }
  }, [open, defaultName]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Project name cannot be empty");
      return;
    }
    setBusy(true);
    try {
      const copy = await copyProject(projectId, trimmed, isPublic);
      toast.success("Copied to a new private project");
      onOpenChange(false);
      onCopied?.(copy.name, copy.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to copy project");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="-mx-4 -mt-4 flex min-w-0 flex-row items-center gap-3 rounded-t-xl border-b border-border/60 bg-muted/50 px-4 pt-3 pb-3 pr-10">
          <DialogTitle>Copy project</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="copy-name" className="text-xs text-muted-foreground">
              New project name
            </Label>
            <Input
              id="copy-name"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
          </div>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Visibility
            </h3>
            <RadioGroup
              value={isPublic ? "public" : "private"}
              onValueChange={(v) => setIsPublic(v === "public")}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="private" id="copy-vis-private" />
                <Label htmlFor="copy-vis-private" className="cursor-pointer">
                  Private
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="public" id="copy-vis-public" />
                <Label htmlFor="copy-vis-public" className="cursor-pointer">
                  Public
                </Label>
              </div>
            </RadioGroup>
          </section>
        </div>
        <DialogFooter className="flex-row items-center">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={busy}>
            <Copy size={16} className="mr-2" />
            Copy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
