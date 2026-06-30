import { generateSpecsLogic } from "./specsServer";
import { generateBomLogic } from "./server";
import { generateVisualFlowLogic } from "./visualFlowServer";
import { withRetry } from "./utils";
import { GeneratedSpecs, GeneratedBOM, GeneratedFlow } from "./types";

export interface PipelineResult {
  specs: GeneratedSpecs;
  bom: GeneratedBOM;
  flow: GeneratedFlow;
}

export async function runPipeline(
  prompt: string | null,
  image: File | null
): Promise<PipelineResult> {
  // 1. Specs
  const specs = await withRetry(async () => {
    return (await generateSpecsLogic(prompt, image)) as GeneratedSpecs;
  });
  console.log("Pipeline Step 1 (Specs) Output:", specs);

  // Wait 2s between steps
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 2. BOM (using Specs as context)
  const specsContext = JSON.stringify(specs);
  const bom = await withRetry(async () => {
    return (await generateBomLogic(specsContext, image)) as GeneratedBOM;
  });
  console.log("Pipeline Step 2 (BOM) Output:", bom);

  // Wait 2s between steps
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 3. Flow (using Specs as context)
  const flow = await withRetry(async () => {
    return (await generateVisualFlowLogic(specsContext, prompt, image)) as GeneratedFlow;
  });
  console.log("Pipeline Step 3 (Flow) Output:", flow);

  return { specs, bom, flow };
}
