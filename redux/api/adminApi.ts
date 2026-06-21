import { baseApi } from "./baseApi";
import type { IApiResponse, IUser, ISkillPost } from "../../types";

export interface IAdminUserListResponse {
  meta: { page: number; limit: number; total: number };
  data: IUser[];
}

export interface IAdminPostListResponse {
  meta: { page: number; limit: number; total: number };
  data: ISkillPost[];
}

export interface IUpdateUserPayload {
  userId: string;
  status?: "ACTIVE" | "SUSPENDED" | "BANNED";
  role?: "USER" | "ADMIN";
}

export interface IModeratePostPayload {
  postId: string;
  action: "APPROVE" | "REJECT" | "FLAG";
  reason?: string;
}

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminOverview: builder.query<any, void>({
      query: () => ({
        url: "/admin/overview",
        method: "GET",
      }),
      transformResponse: (response: IApiResponse<any>) => response.data,
      providesTags: ["Admin"],
    }),
    listUsers: builder.query<IAdminUserListResponse, void>({
      query: () => ({
        url: "/admin/users",
        method: "GET",
      }),
      transformResponse: (response: IApiResponse<IAdminUserListResponse>) => response.data,
      providesTags: ["Admin", "User"],
    }),
    updateUser: builder.mutation<void, IUpdateUserPayload>({
      query: ({ userId, ...payload }) => ({
        url: `/admin/users/${userId}`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: ["Admin", "User"],
      async onQueryStarted({ userId, ...patch }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          adminApi.util.updateQueryData('listUsers', undefined, (draft) => {
            const user = draft.data.find(u => u.id === userId);
            if (user) {
              if (patch.status) user.status = patch.status;
              if (patch.role) user.role = patch.role;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    listBazaarPosts: builder.query<IAdminPostListResponse, void>({
      query: () => ({
        url: "/admin/bazaar-posts",
        method: "GET",
      }),
      transformResponse: (response: IApiResponse<IAdminPostListResponse>) => response.data,
      providesTags: ["Admin", "skillPost"],
    }),
    moderatePost: builder.mutation<void, IModeratePostPayload>({
      query: ({ postId, ...payload }) => ({
        url: `/admin/bazaar-posts/${postId}/moderate`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: ["Admin", "skillPost"],
      async onQueryStarted({ postId, action }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          adminApi.util.updateQueryData('listBazaarPosts', undefined, (draft) => {
            const post = draft.data.find(p => p.id === postId);
            if (post) {
              post.status = action === "APPROVE" ? "APPROVED" : (action === "REJECT" ? "REJECTED" : "FLAGGED");
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
  }),
});

export const {
  useGetAdminOverviewQuery,
  useListUsersQuery,
  useUpdateUserMutation,
  useListBazaarPostsQuery,
  useModeratePostMutation,
} = adminApi;
