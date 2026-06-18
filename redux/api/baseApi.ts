import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

import { getAccessToken, clearAuthStorage } from "../../services/auth.service";
import { logout } from "../features/auth/authSlice";
import { resolveApiBaseUrl } from "../../lib/runtimeUrls";

export const tagTypes = [
  "user",
  "User",
  "skillPost",
  "SkillPosts",
  "MySkills",
  "trade",
  "Trades",
  "Barters",
  "review",
  "notification",
  "adminOverview",
  "adminUsers",
  "adminBazaar",
  "adminDisputes",
  "adminAiInfra",
] as const;

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: ((): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> => {
    const rawBaseQuery = fetchBaseQuery({
      baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000/api/v1',
      // RTK Query allows prepareHeaders to be async
      prepareHeaders: async (headers) => {
        const token = await getAccessToken();

        if (token) {
          headers.set("authorization", `Bearer ${token}`);
        }

        return headers;
      },
      timeout: 30000,
    });

    const getErrorMessage = (errorData: unknown): string => {
      if (typeof errorData === "string") {
        return errorData;
      }

      if (typeof errorData !== "object" || errorData === null) {
        return "";
      }

      if (!("message" in errorData)) {
        return "";
      }

      return typeof (errorData as any).message === "string" ? (errorData as any).message : "";
    };

    const isSessionExpiredError = (error: FetchBaseQueryError): boolean => {
      if (error.status !== 401) {
        return false;
      }

      const message = getErrorMessage(error.data);

      return (
        message === "Your session has expired" ||
        message === "You are not authorized" ||
        message === "Invalid token payload"
      );
    };

    return async (args, api, extraOptions) => {
      const result = await rawBaseQuery(args, api, extraOptions);

      if ("error" in result && result.error && isSessionExpiredError(result.error)) {
        // Clear secure storage as well as redux state
        await clearAuthStorage();
        api.dispatch(logout());
      }

      return result;
    };
  })(),
  tagTypes,
  endpoints: () => ({}),
});
