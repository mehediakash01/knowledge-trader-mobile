import { baseApi } from "./baseApi";
import type { IApiResponse } from "../../types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface IChatMessage {
  id: string;
  barterId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: {
    id: string;
    name?: string;
    image?: string;
  };
}

export interface ISendMessagePayload {
  barterId: string;
  content: string;
}

// ── API endpoints ─────────────────────────────────────────────────────────────
// Backend routes: GET /trades/:barterId/messages  |  POST /trades/:barterId/messages

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getChatMessages: builder.query<IChatMessage[], string>({
      query: (barterId) => ({
        url: `/trades/${barterId}/messages`,
        method: "GET",
      }),
      transformResponse: (response: IApiResponse<IChatMessage[]>) =>
        response.data,
      providesTags: (_result, _error, barterId) => [
        { type: "trade", id: `chat-${barterId}` },
      ],
    }),

    sendChatMessage: builder.mutation<IChatMessage, ISendMessagePayload>({
      query: ({ barterId, content }) => ({
        url: `/trades/${barterId}/messages`,
        method: "POST",
        body: { content },
      }),
      transformResponse: (response: IApiResponse<IChatMessage>) =>
        response.data,
      invalidatesTags: (_result, _error, { barterId }) => [
        { type: "trade", id: `chat-${barterId}` },
      ],
    }),
  }),
});

export const { useGetChatMessagesQuery, useSendChatMessageMutation } = chatApi;
