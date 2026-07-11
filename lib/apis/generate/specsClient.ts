import { GeneratedSpecs } from "@/lib/apis/generate/types";
import { getOrCreateDeviceId } from "@/lib/device";
import { ProviderType } from "@/lib/ai/types";
import { GenerationError } from "./error";

export async function generateSpecs(
  prompt: string | null,
  image: File | null,
  providerType?: ProviderType,
  model?: string,
  signal?: AbortSignal,
): Promise<GeneratedSpecs> {
  const formData = new FormData();
  if (prompt) formData.append("prompt", prompt);
  if (image) formData.append("image", image);
  if (providerType) formData.append("providerType", providerType);
  if (model) formData.append("model", model);

  const response = await fetch("/api/v2/generate/specs", {
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
      "Failed to generate specs",
      code,
      provider,
      response.status,
    );
  }
  return await response.json();
}
