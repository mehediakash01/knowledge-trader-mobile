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
    getWalletBalance: builder.query<number, void>({
      query: () => `/wallet/balance`,
      transformResponse: (response: any) => response.data?.tokenBalance || 0,
      providesTags: ["User"],
    }),
    getTransactionHistory: builder.query<ITransaction[], void>({
      query: () => `/wallet/transactions`,
      transformResponse: (response: any) => {
        // Map wallet transactions exactly as they come from backend
        const txs = response.data || [];
        return txs.map((t: any) => ({
          id: t.id,
          amount: t.amount,
          type: t.type,
          createdAt: t.createdAt,
          description: t.description,
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
