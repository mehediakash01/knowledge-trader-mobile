import { baseApi } from "./baseApi";
import { setAuth } from "../features/auth/authSlice";
import type { IApiResponse, IUser } from "../../types";

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: IUser;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<IAuthResponse, ILoginRequest>({
      query: (payload) => ({
        url: "/auth/login",
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: IApiResponse<IAuthResponse>) => response.data,
      invalidatesTags: ["User"],
    }),
    register: builder.mutation<IUser, IRegisterRequest>({
      query: (payload) => ({
        url: "/users/register",
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: IApiResponse<IUser>) => response.data,
      invalidatesTags: ["User"],
    }),
    googleLogin: builder.mutation<IAuthResponse, { token: string }>({
      query: (payload) => ({
        url: "/auth/google-login",
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: IApiResponse<IAuthResponse>) => response.data,
      invalidatesTags: ["User"],
    }),
    getMe: builder.query<IUser, void>({
      query: () => ({
        url: "/auth/me",
        method: "GET",
      }),
      transformResponse: (response: IApiResponse<IUser>) => response.data,
      providesTags: ["User"],
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setAuth({ user: data }));
        } catch (err) {
          // Silent catch
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGoogleLoginMutation,
  useGetMeQuery,
} = authApi;
