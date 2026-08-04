import { useModelQueries } from "@zenstackhq/tanstack-query/react";
import { schema } from "@package/db/schema-lite";
import type { GetModels } from "@zenstackhq/schema";
import { BACKEND_URL } from "@/config";

export function useModelQuery<Model extends GetModels<typeof schema>>(
  model: Model,
) {
  return useModelQueries(schema, model, {
    endpoint: `${BACKEND_URL}/api/model`,
    fetch: (url: string, options?: RequestInit) =>
      fetch(url, { ...options, credentials: "include" }),
  });
}
