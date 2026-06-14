import { baseApi } from "./baseApi";
import type { IApiResponse, IMyTradesResponse } from "../../types";

export interface ICreateBarterRequestPayload {
  targetPostId: string;
  proposal: string;
  offeredPostId?: string;
}

export const tradeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createBarterRequest: builder.mutation<void, ICreateBarterRequestPayload>({
      query: (payload) => ({
        url: "/trades/barter-request",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Trades", "Barters", "trade", "skillPost", "notification"],
    }),
    getMyTrades: builder.query<IMyTradesResponse, void>({
      query: () => ({
        url: "/trades/my-trades",
        method: "GET",
      }),
      transformResponse: (response: IApiResponse<IMyTradesResponse>) => response.data,
      providesTags: ["Trades", "Barters", "trade"],
    }),
    updateBarterStatus: builder.mutation<void, { barterId: string; action: "ACCEPT" | "DECLINE" }>({
      query: ({ barterId, ...payload }) => ({
        url: `/trades/barter-requests/${barterId}/resolve`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: ["Trades", "Barters", "trade", "skillPost", "notification"],
    }),
    executeTokenTrade: builder.mutation<void, { targetPostId: string }>({
      query: (payload) => ({
        url: "/trades/token-trade",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Trades", "trade", "skillPost", "notification", "User"],
    }),
  }),
});

export const { useCreateBarterRequestMutation, useGetMyTradesQuery, useUpdateBarterStatusMutation, useExecuteTokenTradeMutation } = tradeApi;
