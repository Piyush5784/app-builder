import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/axios";
import type { ApiResponse } from "@package/shared";

export interface Author {
  id: string;
  username: string;
  name: string;
  image: string | null;
}

export interface Post {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
  media: { id: string; url: string; type: string; order: number }[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface FeedResponse {
  posts: Post[];
  pagination: Pagination;
  suggestedUsers?: Author[];
}

export function useFeed(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["feed", page, limit],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FeedResponse>>("/feed", {
        params: { page, limit },
      });
      return data.data!;
    },
  });
}

export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await api.post<ApiResponse<{ liked: boolean }>>(
        `/posts/${postId}/like`,
      );
      return data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useToggleSave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await api.post<ApiResponse<{ saved: boolean }>>(
        `/posts/${postId}/save`,
      );
      return data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      content,
    }: {
      postId: string;
      content: string;
    }) => {
      const { data } = await api.post<ApiResponse<unknown>>(
        `/posts/${postId}/comments`,
        { content },
      );
      return data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
