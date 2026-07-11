import { GeneratedBOM } from "@/lib/apis/generate/types";
import { getOrCreateDeviceId } from "@/lib/device";
import { ProviderType } from "@/lib/ai/types";
import { GenerationError } from "./error";

export async function generateBOM(
  specsContext: string,
  image: File | null,
  projectId: string,
  providerType?: ProviderType,
  model?: string,
  signal?: AbortSignal,
): Promise<GeneratedBOM> {
  const formData = new FormData();
  formData.append("specsContext", specsContext);
  formData.append("projectId", projectId);
  if (image) formData.append("image", image);
  if (providerType) formData.append("providerType", providerType);
  if (model) formData.append("model", model);

  const response = await fetch("/api/v2/generate/bom", {
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
        code?: string;
        provider?: string;
      };
      code = data.code ?? data.error;
      provider = data.provider;
    } catch {
      // ignore parse failures
    }
    throw new GenerationError(
      "Failed to generate BOM",
      code,
      provider,
      response.status,
    );
  }
  return await response.json();
}
