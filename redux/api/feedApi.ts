import { baseApi } from "./baseApi";
import type { ISkillPostListResponse, IApiResponse, ISkillPost, ISkillPostPaginationMeta } from "../../types";

export interface ICreateSkillPostPayload {
  title: string;
  slug: string;
  category: string;
  tags?: string[];
  shortDescription: string;
  thumbnail?: string;
  teaserAsset?: string;
  roadmapType?: "HOURLY" | "DAILY" | "SEVEN_DAY" | "THIRTY_DAY";
  outcomes?: string[];
  targetAudience?: string;
  prerequisites?: string;
  valueProp?: string;
  longDescription?: string;
  syllabus?: unknown;
  resourceLinks?: string[];
  lockedContent?: unknown;
  tokenPrice: number;
  images?: string[];
}

export const feedApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllSkillPosts: builder.query<ISkillPostListResponse, any>({
      query: (params) => ({
        url: "/skill-posts",
        method: "GET",
        params: params || undefined,
      }),
      transformResponse: (response: IApiResponse<ISkillPost[]>) => ({
        meta: response.meta as ISkillPostPaginationMeta,
        data: response.data,
      }),
      providesTags: ["SkillPosts"],
    }),
    getCategories: builder.query<string[], void>({
      query: () => ({
        url: "/skill-posts/categories",
        method: "GET",
      }),
      transformResponse: (response: IApiResponse<string[]>) => response.data,
      providesTags: ["SkillPosts"],
    }),
    getSkillPostById: builder.query<ISkillPost, string>({
      query: (id) => ({
        url: `/skill-posts/${id}`,
        method: "GET",
      }),
      transformResponse: (response: IApiResponse<ISkillPost>) => response.data,
      providesTags: (_result, _error, id) => [{ type: "skillPost" as const, id }],
    }),
    getMySkills: builder.query<ISkillPostListResponse, string>({
      query: (creatorId) => ({
        url: "/skill-posts",
        method: "GET",
        params: { creatorId, limit: 20, sortOrder: "desc" },
      }),
      transformResponse: (response: IApiResponse<ISkillPost[]>) => ({
        meta: response.meta as ISkillPostPaginationMeta,
        data: response.data,
      }),
      providesTags: ["SkillPosts"],
    }),
    createSkillPost: builder.mutation<ISkillPost, ICreateSkillPostPayload>({
      query: (payload) => ({
        url: "/skill-posts",
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: IApiResponse<ISkillPost>) => response.data,
      invalidatesTags: ["SkillPosts", "MySkills", "skillPost"],
    }),
  }),
});

export const {
  useGetAllSkillPostsQuery,
  useGetCategoriesQuery,
  useGetSkillPostByIdQuery,
  useGetMySkillsQuery,
  useCreateSkillPostMutation,
} = feedApi;
