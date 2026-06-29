import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, FileText } from "lucide-react";
import { generateSpecs } from "@/lib/apis/generate/specsClient";
import { downloadReport } from "@/lib/apis/pdf/client";

export function SpecsGeneratorButton({
  prompt,
  image,
  projectName,
}: {
  prompt: string | null;
  image: File | null;
  projectName: string;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const specsData = await generateSpecs(prompt, image);
      
      // Transform specs data into items format required by PDF generator
      const items = specsData.specs; // Now contains componentName, computedSpecs, reasoning, calculation

      await downloadReport({ projectName, items });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleGenerate} disabled={isLoading} variant="secondary">
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
      Generate Specs PDF
    </Button>
  );
}
