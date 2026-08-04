import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const info = (error as { info?: { message?: string } }).info;
    if (info?.message) return info.message;
    return error.message;
  }
  return "Something went wrong";
}

// Query Client with UI notification logging
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 1 day
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      const message = extractErrorMessage(error);
      console.error("Query error:", message);
      toast.error(`Server error: ${message}`);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      const message = extractErrorMessage(error);
      console.error("Mutation error:", message);
      toast.error(`Server error: ${message}`);
    },
  }),
});
