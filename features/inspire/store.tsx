"use client";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { generateSpecs } from "@/lib/apis/generate/specsClient";
import { generateBOM } from "@/lib/apis/generate/bomClient";
import { generateVisualFlow } from "@/lib/apis/generate/visualFlowClient";
import { withRetry } from "@/lib/apis/generate/utils";
import { GenerationError } from "@/lib/apis/generate/error";
import { downloadReport } from "@/lib/apis/pdf/client";
import {
  GeneratedSpecs,
  GeneratedFlow,
  GeneratedBOM,
} from "@/lib/apis/generate/types";
import {
  ProjectComponentModel,
  ProjectEdgeModel,
  ProjectModel,
  ProjectNodeModel,
  ProjectTagEnum,
} from "@/lib/apis/project/types";
import { BomAlert } from "@/features/bom/data";
import { syncGeneratedData } from "@/lib/apis/project/syncClient";
import { getMockData } from "./mockData";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  getRateLimitStatus,
  consumeRateLimitQuota,
  RateLimitStatus,
} from "@/lib/rate-limit/client";
import { useSettings } from "@/features/settings/store";
import { useSessionVersion } from "@/features/auth/store";
import { toast } from "sonner";

const USE_MOCK_DATA = false; // Toggle here

interface SelectedFile {
  file: File;
  preview: string;
}

interface InspireStore {
  prompt: string;
  setPrompt: Dispatch<SetStateAction<string>>;
  selectedFiles: SelectedFile[];
  addFile: (file: File) => void;
  removeFile: (index: number) => void;
  isLoading: boolean;
  loadingText: string;
  isCancelling: boolean;
  rateLimitStatus: RateLimitStatus | null;
  fetchRateLimitStatus: () => Promise<void>;
  generate: (
    router: AppRouterInstance,
    loadDynamicProject: (
      projectName: string,
      tag: ProjectTagEnum,
      newComponents: ProjectComponentModel[],
      newAlerts?: BomAlert[],
      newSpecs?: GeneratedSpecs,
      newPdfReport?: Blob | null,
    ) => void,
    loadDynamicFlow: (
      flowData: GeneratedFlow,
      project?: ProjectModel,
      nodes?: ProjectNodeModel[],
      edges?: ProjectEdgeModel[],
    ) => void,
  ) => Promise<void>;
  cancelGeneration: () => void;
  setLoadingState: (loading: boolean, text?: string) => void;
}

const Ctx = createContext<InspireStore | null>(null);

export function InspireProvider({ children }: { children: ReactNode }) {
  const [prompt, setPromptState] = useState("");
  const [selectedFiles, setSelectedFilesState] = useState<SelectedFile[]>([]);
  const [isLoading, setIsLoadingState] = useState(false);
  const [loadingText, setLoadingTextState] = useState("Generating...");
  const [isCancelling, setIsCancellingState] = useState(false);
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(
    null,
  );
  const { defaultProvider, defaultModel } = useSettings();
  const cancelledRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchRateLimitStatus = useCallback(async () => {
    try {
      const status = await getRateLimitStatus();
      setRateLimitStatus(status);
    } catch (e) {
      console.error("Failed to fetch rate limit status:", e);
    }
  }, []);

  const sessionVersion = useSessionVersion();

  // The identity changed (login / logout / switch account): refresh the rate
  // limit allowance (it differs for guests vs signed-in users) and clear any
  // in-progress prompt / uploaded files so they don't leak to the next person.
  useEffect(() => {
    if (sessionVersion === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPromptState("");
    setSelectedFilesState([]);
    fetchRateLimitStatus();
  }, [sessionVersion, fetchRateLimitStatus]);

  const addFile = useCallback((file: File) => {
    const preview = URL.createObjectURL(file);
    setSelectedFilesState((prev) => [...prev, { file, preview }]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFilesState((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        URL.revokeObjectURL(updated[index].preview);
      }
      updated.splice(index, 1);
      return updated;
    });
  }, []);

  const setLoadingState = useCallback((loading: boolean, text?: string) => {
    setIsLoadingState(loading);
    if (text) setLoadingTextState(text);
  }, []);

  const cancelGeneration = useCallback(() => {
    cancelledRef.current = true;
    setIsCancellingState(true);
    abortRef.current?.abort();
  }, []);

  const generate = useCallback(
    async (
      router: AppRouterInstance,
      loadDynamicProject: (
        projectName: string,
        tag: ProjectTagEnum,
        newComponents: ProjectComponentModel[],
        newAlerts?: BomAlert[],
        newSpecs?: GeneratedSpecs,
        newPdfReport?: Blob | null,
      ) => void,
      loadDynamicFlow: (
        flowData: GeneratedFlow,
        project?: ProjectModel,
        nodes?: ProjectNodeModel[],
        edges?: ProjectEdgeModel[],
      ) => void,
    ) => {
      cancelledRef.current = false;
      const controller = new AbortController();
      abortRef.current = controller;
      let completed = false;

      if (prompt.trim() === "" && selectedFiles.length === 0) {
        throw new Error("Prompt and files are empty");
      }

      // Pre-check rate limit
      const currentStatus = await getRateLimitStatus();
      setRateLimitStatus(currentStatus);
      // Users with their own API keys are unlimited — skip the allowance check.
      // Use the freshly-fetched status rather than the stale closure value.
      const isUnlimited = currentStatus.unlimited ?? false;
      if (!isUnlimited && currentStatus.remaining <= 0) {
        throw new Error(
          currentStatus.isGuest
            ? `You've used all ${currentStatus.limit} free generations today. Sign up for more.`
            : `You've used all ${currentStatus.limit} generations today. Try again tomorrow.`,
        );
      }

      setIsLoadingState(true);
      try {
        const imageFile =
          selectedFiles.length > 0 ? selectedFiles[0].file : null;
        const sanitizedPrompt = prompt
          ? prompt.replace(/[^\x00-\x7F]/g, "")
          : null;

        // projectId
        const timestamp = new Date().toISOString();
        const projectId = `project-${timestamp}`;

        // 1. Specs
        setLoadingTextState("Calculating specs...");
        let specsData: GeneratedSpecs;
        let bomResult: GeneratedBOM;
        let flowResult: GeneratedFlow;

        if (USE_MOCK_DATA) {
          console.log("Using Mock Data");
          const mock = getMockData(projectId);
          specsData = mock.specsData;
          bomResult = mock.bomResult;
          flowResult = mock.flowResult;
        } else {
          const specsRaw = await withRetry(
            async () => {
              return await generateSpecs(
                sanitizedPrompt,
                imageFile,
                defaultProvider,
                defaultModel,
                controller.signal,
              );
            },
            undefined,
            undefined,
            controller.signal,
          );
          specsData = specsRaw;
          const specsContext = JSON.stringify(specsData);
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // 2. BOM
          setLoadingTextState("Generating BOM...");
          if (cancelledRef.current) return;
          bomResult = await withRetry(
            async () => {
              return await generateBOM(
                specsContext,
                imageFile,
                projectId,
                defaultProvider,
                defaultModel,
                controller.signal,
              );
            },
            undefined,
            undefined,
            controller.signal,
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // 3. Flow
          setLoadingTextState("Generating visual flow...");
          if (cancelledRef.current) return;
          flowResult = await withRetry(
            async () => {
              return await generateVisualFlow(
                JSON.stringify(bomResult.components),
                JSON.stringify(specsData),
                sanitizedPrompt,
                imageFile,
                projectId,
                defaultProvider,
                defaultModel,
                controller.signal,
              );
            },
            undefined,
            undefined,
            controller.signal,
          );
        }

        const projectName = flowResult.name || "Generated Project";
        if (cancelledRef.current) return;

        setLoadingTextState("Generating report...");
        const pdfBytes = (await downloadReport(
          {
            projectName,
            items: specsData.specs,
          },
          true,
        )) as ArrayBuffer;

        // Sync to DB
        const syncResult = await syncGeneratedData(
          projectName,
          specsData,
          bomResult,
          flowResult,
          pdfBytes,
        );

        // Count exactly one generation now that the full pipeline has
        // succeeded and synced. Retries on individual AI calls don't count.
        // Users with their own keys are unlimited — don't consume quota.
        if (!isUnlimited && !cancelledRef.current) {
          await consumeRateLimitQuota();
        }
        completed = true;
        fetchRateLimitStatus();

        loadDynamicProject(
          projectName,
          syncResult.projectTag,
          syncResult.projectComponents,
          bomResult.alerts,
          specsData,
          new Blob([pdfBytes], { type: "application/pdf" }),
        );

        loadDynamicFlow(
          flowResult,
          syncResult.project,
          syncResult.nodes,
          syncResult.edges,
        );

        router.push(
          `/bom?generate=dynamic&prompt=${encodeURIComponent(projectName)}`,
        );
      } catch (e) {
        const isCancel =
          (e instanceof Error && e.message === "Generation cancelled") ||
          (e as { name?: string })?.name === "AbortError";
        if (isCancel) {
          // Cancellation is handled in `finally` (consumes one quota).
          // Swallow it without logging — it is an expected, user-initiated stop.
          return;
        }

        // API-key errors can arrive as either the explicit server code or the
        // upstream Google message, so check both.
        const isApiKeyError =
          (e instanceof GenerationError &&
            (e.code === "API_KEY_INVALID" ||
              /api[ _-]?key (is )?(not valid|invalid)/i.test(e.code ?? ""))) ||
          /api[ _-]?key (is )?(not valid|invalid)/i.test(
            e instanceof Error ? e.message : "",
          );

        if (e instanceof GenerationError && e.code === "PROVIDER_UNAVAILABLE") {
          // The persistent toast is the only UX — no console noise.
          toast.error(
            "Your default provider is unavailable. Add your own API keys or choose another provider.",
            {
              duration: Infinity,
              closeButton: false,
              action: {
                label: "Manage API keys",
                onClick: () => router.push("/settings?section=keys"),
              },
            },
          );
          return;
        }
        if (isApiKeyError) {
          // The persistent toast is the only UX — no console noise, no rethrow.
          toast.error(
            "Your API key is invalid. Check your API keys to keep generating.",
            {
              duration: Infinity,
              closeButton: true,
              action: {
                label: "Open settings",
                onClick: () => router.push("/settings?section=keys"),
              },
            },
          );
          return;
        }

        // Whole-pipeline failure: retries exhausted, model fallback failed,
        // or another unrecoverable AI error. Surface a clear toast, log it,
        // and re-throw so the page tip can react.
        console.error(e);
        const pipelineMessage =
          e instanceof Error && e.message === "Max retries exceeded"
            ? "Generation failed after multiple attempts. Please try again."
            : "Something went wrong during generation. Please try again.";
        toast.error(pipelineMessage);
        throw e;
      } finally {
        // A cancelled generation still counts as one generation. The success
        // path already consumed its quota (completed === true), so skip it here.
        if (cancelledRef.current && !completed && !isUnlimited) {
          await consumeRateLimitQuota();
          fetchRateLimitStatus();
        }
        setIsCancellingState(false);
        setIsLoadingState(false);
        setLoadingTextState("Generating...");
      }
    },
    [prompt, selectedFiles, defaultProvider, defaultModel, fetchRateLimitStatus],
  );

  const value = useMemo<InspireStore>(
    () => ({
      prompt,
      setPrompt: setPromptState,
      selectedFiles,
      addFile,
      removeFile,
      isLoading,
      loadingText,
      isCancelling,
      rateLimitStatus,
      fetchRateLimitStatus,
      setLoadingState,
      generate,
      cancelGeneration,
    }),
    [
      prompt,
      selectedFiles,
      isLoading,
      loadingText,
      isCancelling,
      rateLimitStatus,
      addFile,
      removeFile,
      setLoadingState,
      fetchRateLimitStatus,
      generate,
      cancelGeneration,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInspire() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useInspire outside provider");
  return v;
}
