import { baseApi } from "./baseApi";

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
  }),
});

export const { useCreateBarterRequestMutation } = tradeApi;
