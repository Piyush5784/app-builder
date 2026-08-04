import type { ApiResponse } from "@package/shared";

export const createSuccessResponse = <T = unknown>(
  data?: T,
  message?: string,
): ApiResponse<T> => ({
  success: true,
  message,
  data,
});

export const createErrorResponse = (error: string): ApiResponse => ({
  success: false,
  error,
});
