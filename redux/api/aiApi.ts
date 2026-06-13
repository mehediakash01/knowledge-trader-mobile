import { baseApi } from "./baseApi";
import type { IApiResponse } from "../../types";

// ── Types (1:1 mirror of reference aiApi.ts) ─────────────────────────────────

export interface ISkillAIReview {
  sentimentScore: number;
  pros: string[];
  cons: string[];
  summary: string;
}

export interface ISkillAIReviewResponse {
  review: ISkillAIReview | null;
  warning?: string;
  cachedAt?: string | null;
  generatedAt?: string | null;
  hasCachedReview: boolean;
}

export interface ISummarizeReviewsResponse {
  pros: string[];
  cons: string[];
  summary: string;
}

export interface IMatchSkillResponse {
  isTrendingFallback?: boolean;
  matches: {
    post: import("../../types").ISkillPost;
    score: number;
    reason: string;
    isPriorityMatch?: boolean;
    hasReciprocalMatch?: boolean;
    matchSkill?: string | null;
  }[];
}

// ── API slice ────────────────────────────────────────────────────────────────

export const aiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /ai/reviews/:postId — fetch cached AI review for a skill post
    getSkillAIReview: builder.query<ISkillAIReviewResponse, string>({
      query: (postId) => ({
        url: `/ai/reviews/${postId}`,
        method: "GET",
      }),
      transformResponse: (response: IApiResponse<ISkillAIReviewResponse>) =>
        response.data,
      providesTags: (_result, _error, postId) => [
        { type: "skillPost", id: `ai-review-${postId}` },
      ],
    }),

    // POST /ai/reviews/:postId/generate — trigger AI review generation
    generateSkillAIReview: builder.mutation<ISkillAIReviewResponse, string>({
      query: (postId) => ({
        url: `/ai/reviews/${postId}/generate`,
        method: "POST",
      }),
      transformResponse: (response: IApiResponse<ISkillAIReviewResponse>) =>
        response.data,
      invalidatesTags: (_result, _error, postId) => [
        { type: "skillPost", id: `ai-review-${postId}` },
      ],
    }),

    // POST /ai/summarize-reviews/:postId — summarize user reviews with AI
    summarizeReviews: builder.mutation<ISummarizeReviewsResponse, string>({
      query: (postId) => ({
        url: `/ai/summarize-reviews/${postId}`,
        method: "POST",
      }),
      transformResponse: (response: IApiResponse<ISummarizeReviewsResponse>) =>
        response.data,
    }),
  }),
});

export const {
  useGetSkillAIReviewQuery,
  useGenerateSkillAIReviewMutation,
  useSummarizeReviewsMutation,
} = aiApi;
