import { GeneratedFlow } from "@/lib/apis/generate/types";
import { getOrCreateDeviceId } from "@/lib/device";
import { ProviderType } from "@/lib/ai/types";
import { GenerationError } from "./error";

export async function generateVisualFlow(
  bomComponentsContext: string,
  specsContext: string,
  prompt: string | null,
  image: File | null,
  projectId: string,
  providerType?: ProviderType,
  model?: string,
  signal?: AbortSignal,
): Promise<GeneratedFlow> {
  const formData = new FormData();
  formData.append("bomComponentsContext", bomComponentsContext);
  formData.append("specsContext", specsContext);
  if (prompt) formData.append("prompt", prompt);
  if (image) formData.append("image", image);
  formData.append("projectId", projectId);
  if (providerType) formData.append("providerType", providerType);
  if (model) formData.append("model", model);

  const response = await fetch("/api/v2/generate/visual-flow", {
    method: "POST",
    headers: { "x-device-id": getOrCreateDeviceId() },
    body: formData,
    signal,
  });

  if (!response.ok) {
    let code: string | undefined;
    let provider: string | undefined;
    try {
      const data = (await response.json()) as {
        error?: string;
        provider?: string;
      };
      code = data.error;
      provider = data.provider;
    } catch {
      // ignore parse failures
    }
    throw new GenerationError(
      "Failed to generate visual flow",
      code,
      provider,
      response.status,
    );
  }
  return response.json();
}
