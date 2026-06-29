"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  Sparkles,
  Upload,
  Wand2,
  Zap,
  Clock,
  Bot,
  Wifi,
  Network,
  Cpu,
  X,
  Loader2,
  HelpCircle,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useBom } from "@/features/bom/store";
import { generateBOM } from "@/lib/apis/generate/client";
import Link from "next/link";
import Image from "next/image";
import { SpecsGeneratorButton } from "@/components/SpecsGeneratorButton";
import { cn, formatRelativeTime } from "@/lib/utils";
import { getAllProjects } from "@/lib/apis/project/client";
import { ProjectCost } from "@/components/ProjectCost";
import { ProjectModel } from "@/lib/apis/project/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const categoryIcons: Record<string, typeof Bot> = {
  Robotics: Bot,
  IoT: Wifi,
  Networking: Network,
  Mechatronics: Cpu,
  Power: Zap,
  "N/A": HelpCircle,
};

const suggestions = [
  "5V line-following robot with a higher voltage buzzer",
  "ESP32 weather station, OLED + BME280",
  "Bluetooth audio amp, 2x3W class-D",
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [previewImage, setPreviewImage] = useState<{
    file: File;
    preview: string;
    index: number;
  } | null>(null);
  const router = useRouter();

  const { loadDynamicProject } = useBom();

  useEffect(() => {
    async function fetchProjects() {
      try {
        const data = await getAllProjects();
        setProjects(data.slice(0, 2));
      } catch (e) {
        console.error("Failed to fetch projects", e);
      }
    }
    fetchProjects();
  }, []);

  const handleGenerate = async () => {
    // ...
    if (prompt.trim() === "" && selectedFiles.length === 0) {
      setShowTip(true);
      setTimeout(() => setShowTip(false), 3000);
      return;
    }

    setIsLoading(true);
    try {
      const imageFile = selectedFiles.length > 0 ? selectedFiles[0].file : null;
      const data = await generateBOM(prompt || null, imageFile);

      const projectName = prompt ? prompt : "Extracted Schematic";
      loadDynamicProject(
        projectName,
        data.tag || "N/A",
        data.items,
        data.alerts,
      );

      router.push(
        `/bom?generate=dynamic&prompt=${encodeURIComponent(projectName)}`,
      );
    } catch (e) {
      console.error(e);
      setShowTip(true); // Fallback error handling
      setTimeout(() => setShowTip(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<
    { file: File; preview: string }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null) => {
    if (!file) return;

    // Create preview URL
    const preview = URL.createObjectURL(file);
    setSelectedFiles((prev) => [...prev, { file, preview }]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
    setPreviewImage(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-6 px-5 pt-14 pb-48">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Dragonfly
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {"Let's build something"}
          </h1>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface ring-1 ring-white/5">
          <span className="text-sm font-medium text-primary">AK</span>
        </div>
      </header>

      {/* Upload card */}
      <motion.div
        whileTap={{ scale: 0.985 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-white/10 bg-surface/40 hover:border-primary/40"
        }`}
      >
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
          accept="image/*,.kicad_pcb"
        />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/30">
          <Upload className="text-primary" size={24} />
          <div className="absolute inset-0 rounded-2xl bg-primary/20 opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
        </div>
        <div>
          <p className="font-medium">Drop a circuit diagram</p>
          <p className="mt-1 text-xs text-muted-foreground">
            PNG, JPG, or KiCad export
          </p>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-primary">
          <Camera size={14} />
          <span>or click to browse</span>
        </div>
      </motion.div>

      {/* Selected Images Preview */}
      {selectedFiles.length > 0 && (
        <div
          className={cn(
            "flex flex-row flex-nowrap gap-4 justify-start w-full max-w-full",
            "overflow-x-auto pr-2 scrollbar-thin",
          )}
        >
          {selectedFiles.map((item, index) => (
            <div
              key={index}
              className="relative h-18 w-18 flex-shrink-0 mt-2 cursor-pointer"
              onClick={() => setPreviewImage({ ...item, index })}
            >
              <Image
                width={72}
                height={72}
                src={item.preview}
                alt={`Preview ${index}`}
                className="rounded-lg object-contain w-full h-full"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className={cn(
                  "absolute -top-2 -right-2",
                  "flex p-1 items-center justify-center",
                  "rounded-full bg-red-500/60 text-white",
                  "border border-red-500 shadow-sm",
                  "hover:cursor-pointer",
                )}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => !open && setPreviewImage(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-normal text-muted-foreground">
              {previewImage?.file.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center max-h-[60vh] overflow-y-auto">
            {previewImage && (
              <Image
                width={400}
                height={400}
                src={previewImage.preview}
                alt={previewImage.file.name}
                className="rounded-lg object-contain"
              />
            )}
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => previewImage && removeFile(previewImage.index)}
            >
              <Trash2 size={16} className="mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prompt */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <Wand2 size={14} />
          <span>Describe it</span>
        </div>
        <div className="rounded-3xl border border-white/5 bg-surface/60 p-4 focus-within:border-primary/40 focus-within:glow-soft">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={prompt.length > 60 ? 4 : 2}
            placeholder="I need parts for a 5V line-following robot with a higher voltage buzzer…"
            className="w-full resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setPrompt(s)}
                className="rounded-full bg-white/[0.04] px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Generate */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleGenerate}
        disabled={isLoading}
        className="glow-primary mt-2 flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-semibold text-primary-foreground disabled:opacity-70"
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles size={18} />
            Generate BOM
          </>
        )}
      </motion.button>
      
      <SpecsGeneratorButton 
        prompt={prompt} 
        image={selectedFiles.length > 0 ? selectedFiles[0].file : null} 
        projectName={prompt || "Extracted Schematic"}
      />

      {showTip && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-xs text-warning mt-2"
        >
          Please enter a description to generate a BOM.
        </motion.p>
      )}

      {/* Recent */}
      <section className="mt-2">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            Recent projects
          </h2>
          <Link href="/bom" className="text-xs text-primary hover:underline">
            See all
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-2xl bg-surface/60 p-4 ring-1 ring-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {(() => {
                    const Icon = categoryIcons[p.tag] || Zap;
                    return <Icon size={18} />;
                  })()}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    <ProjectCost project={p} />
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {p.tag}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={12} /> {formatRelativeTime(p.time)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
