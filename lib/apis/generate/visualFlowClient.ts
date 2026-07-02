import { GeneratedFlow } from "@/lib/apis/generate/types";

export async function generateVisualFlow(bomContext: string, prompt: string | null, image: File | null): Promise<GeneratedFlow> {
  const formData = new FormData();
  formData.append("bomContext", bomContext);
  if (prompt) formData.append("prompt", prompt);
  if (image) formData.append("image", image);

  const response = await fetch("/api/v2/generate/visual-flow", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error || "Failed to generate visual flow";
    throw new Error(message);
  }
  return response.json();
}
