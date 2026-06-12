import { baseApi } from "./baseApi";
import type { ISkillPostListResponse, IApiResponse, ISkillPost, ISkillPostPaginationMeta } from "../../types";

export const feedApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFeed: builder.query<ISkillPostListResponse, void>({
      query: () => ({
        url: "/skill-posts",
        method: "GET",
      }),
      transformResponse: (response: IApiResponse<ISkillPost[]>) => ({
        meta: response.meta as ISkillPostPaginationMeta,
        data: response.data,
      }),
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
  }),
});

export const { useGetFeedQuery, useGetSkillPostByIdQuery, useGetMySkillsQuery } = feedApi;
