/**
 * AI Intervention System Integration
 * 
 * This file provides integration between the existing Dragonfly AI generation system
 * and the new multi-provider AI architecture.
 * 
 * Integration Points:
 * 1. Backward Compatibility - Existing API endpoints continue to work unchanged
 * 2. Provider Selection - New providerType parameter for all generation endpoints
 * 3. Migration Layer - Gradual transition from Gemini-only to multi-provider
 * 4. Performance Optimization - Caching, metrics, and fallback logic
 * 5. Monitoring - Real-time metrics and provider performance tracking
 */

import { NextRequest, NextResponse } from "next/server";
import { AIProviderUtils } from "@/lib/ai/utils";
import { ProviderType } from "@/lib/ai/types";

// Initialize the AI manager with provider priority
const aiManager = AIProviderUtils.createManager({
  providerPriority: [ProviderType.GEMINI, ProviderType.OPENAI, ProviderType.OPENROUTER, ProviderType.CHATGPT],
  enableCaching: true,
  maxRetries: 3,
});

// Export the manager for direct usage
export { aiManager };

// Re-export types for convenience
export * from "@/lib/ai/types";
export * from "@/lib/ai/client";
export * from "@/lib/ai/manager";
export * from "@/lib/ai/utils";
export * from "@/lib/ai/metrics";
export * from "@/lib/ai/cache";

// Legacy compatibility functions - maintain backward compatibility
export const legacyGenerator = {
  async generateBOM(
    specsContext: string | null,
    image: File | null,
    projectId: string,
    generationTimestamp?: string
  ) {
    console.warn("⚠️ Using legacy Gemini-only generator - consider migrating to multi-provider");
    const response = await aiManager.generateBOM(specsContext, image ?? undefined, projectId, generationTimestamp, {
      useCache: true,
      preferProvider: ProviderType.GEMINI,
    });
    return response.data;
  },

  async generateSpecs(
    prompt: string | null,
    image: File | null
  ) {
    console.warn("⚠️ Using legacy Gemini-only generator - consider migrating to multi-provider");
    const response = await aiManager.generateSpecs(prompt, image ?? undefined, {
      useCache: true,
      preferProvider: ProviderType.GEMINI,
    });
    return response.data;
  },

  async generateVisualFlow(
    bomComponentsContext: string,
    specsContext: string,
    prompt: string | null,
    image: File | null,
    projectId: string
  ) {
    console.warn("⚠️ Using legacy Gemini-only generator - consider migrating to multi-provider");
    const response = await aiManager.generateVisualFlow(
      bomComponentsContext,
      specsContext,
      prompt,
      image ?? undefined,
      projectId,
      {
        useCache: true,
        preferProvider: ProviderType.GEMINI,
      }
    );
    return response.data;
  },
};

// Migration helper for gradual transition
export const migrationHelper = {
  getProviderStatus: () => {
    const metrics = aiManager.getMetrics();
    return {
      healthyProviders: Object.entries(metrics.providerStats)
        .filter(([_, stats]) => stats.available)
        .map(([provider]) => provider as ProviderType),
      totalRequests: metrics.totalRequests,
      successRate: metrics.totalRequests > 0 ? (metrics.successfulRequests / metrics.totalRequests) * 100 : 0,
    };
  },

  async testProvider(provider: ProviderType): Promise<boolean> {
    try {
      const startTime = Date.now();
      await aiManager.generateSpecs("Test prompt", undefined, {
        preferProvider: provider,
      });
      const latency = Date.now() - startTime;
      console.log(`✅ Provider ${provider} responded in ${latency}ms`);
      return true;
    } catch (error) {
      console.error(`❌ Provider ${provider} failed:`, error);
      return false;
    }
  },

  async switchProvider(
    fromProvider: ProviderType,
    toProvider: ProviderType
  ): Promise<void> {
    console.log(`🔄 Switching from ${fromProvider} to ${toProvider}`);
    const otherProviders = (Object.keys(aiManager.getMetrics().providerStats) as ProviderType[])
      .filter((p) => p !== toProvider);
    aiManager.updateProviderPriority([toProvider, ...otherProviders]);
  },
};