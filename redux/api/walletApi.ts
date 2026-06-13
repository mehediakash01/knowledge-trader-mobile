import { baseApi } from "./baseApi";

export interface ITransaction {
  id: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  createdAt: string;
  description?: string;
}

export const walletApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWalletBalance: builder.query<number, string>({
      query: (userId) => `/users/profile/${userId}`,
      transformResponse: (response: any) => response.data?.tokenBalance || 0,
      providesTags: ["User"],
    }),
    getTransactionHistory: builder.query<ITransaction[], void>({
      query: () => `/trades/my-trades`,
      transformResponse: (response: any) => {
        // Map trades or mock transactions based on trades
        const trades = response.data?.trades || response.data || [];
        return trades.map((t: any) => ({
          id: t.id,
          amount: t.tokenPrice || t.post?.tokenPrice || 0,
          type: "DEBIT", // Simplification
          createdAt: t.createdAt,
          description: `Trade for ${t.post?.title || 'Knowledge'}`,
        }));
      },
      providesTags: ["Trades"],
    }),
    purchaseTokens: builder.mutation<void, { amount: number }>({
      query: (payload) => ({
        url: "/wallet/purchase", // Fallback/planned endpoint
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["User"],
    }),
    exchangeTokens: builder.mutation<void, { amount: number }>({
      query: (payload) => ({
        url: "/wallet/exchange", // Fallback/planned endpoint
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useGetWalletBalanceQuery,
  useGetTransactionHistoryQuery,
  usePurchaseTokensMutation,
  useExchangeTokensMutation,
} = walletApi;
