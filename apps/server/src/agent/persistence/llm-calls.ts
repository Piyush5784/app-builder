import { prisma } from "@package/db";

export interface CreateLLMCallParams {
  runId: string;
  provider: string;
  model: string;
  step: number;
  prompt: unknown;
  response: unknown;
  tokensIn?: number;
  tokensOut?: number;
  success: boolean;
  errorMessage?: string;
  latencyMs: number;
}

// `prompt`/`response` land in Json columns — Prisma's InputJsonValue type
// isn't worth pulling @prisma/client in as a direct dependency just for this
// cast, so the boundary is a single `as never` here instead.
export async function createLLMCall(
  params: CreateLLMCallParams,
): Promise<string> {
  const call = await prisma.lLMCall.create({
    data: {
      runId: params.runId,
      provider: params.provider,
      model: params.model,
      step: params.step,
      prompt: params.prompt as never,
      response: params.response as never,
      tokensIn: params.tokensIn,
      tokensOut: params.tokensOut,
      success: params.success,
      errorMessage: params.errorMessage,
      latencyMs: params.latencyMs,
    },
  });
  return call.id;
}
