"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Sparkles, Upload, Wand2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

const suggestions = [
  "5V line-following robot with a higher voltage buzzer",
  "ESP32 weather station, OLED + BME280",
  "Bluetooth audio amp, 2x3W class-D",
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6 px-5 pt-14 pb-48">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Good evening
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
      <motion.button
        whileTap={{ scale: 0.985 }}
        className="group relative flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-white/10 bg-surface/40 px-6 py-10 text-center transition-colors hover:border-primary/40"
      >
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
          <span>or snap a photo</span>
        </div>
      </motion.button>

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
        onClick={() => router.push(`/bom`)}
        className="glow-primary mt-2 flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-semibold text-primary-foreground"
      >
        <Sparkles size={18} />
        Generate BOM
      </motion.button>

      {/* Recent */}
      <section className="mt-2">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            Recent projects
          </h2>
          <button className="text-xs text-primary">See all</button>
        </div>
        <div className="flex flex-col gap-2">
          {[
            { name: "Line-Follower Bot", parts: 7, cost: 3387.2 },
            { name: "ESP32 Weather Node", parts: 5, cost: 1983.6 },
          ].map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between rounded-2xl bg-surface/60 p-4 ring-1 ring-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Zap size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.parts} parts · ₱{p.cost.toFixed(2)}
                  </p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">2d</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
