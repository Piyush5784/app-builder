import { AxiosError } from "axios";
type ApiError = {
  success?: boolean;
  error?: string;
  message?: string;
};
export function getApiErrorMessage(
  error: unknown,
  fallback = "Registration failed",
) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiError | undefined;
    return data?.error ?? data?.message ?? fallback;
  }
  return fallback;
}
