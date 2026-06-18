export interface IUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  status?: "ACTIVE" | "SUSPENDED" | "BANNED";
  image?: string;
  bio?: string | null;
  tagline?: string | null;
  ktBalance?: number;
  tokenBalance?: number;
  reputationScore?: number;
  expertise?: { name: string; level: string }[];
  learningPath?: { name: string; priority: number }[];
}

export interface IApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: any;
}

export interface ISkillPost {
  description: any;
  id: string;
  title: string;
  category: string;
  shortDescription?: string;
  longDescription?: string;
  tags?: string[];
  thumbnail?: string;
  creator: {
    id: string;
    name: string;
    image?: string;
  };
  tokenPrice: number;
  status: string;
}

export interface ISkillPostPaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export interface ISkillPostListResponse {
  meta: ISkillPostPaginationMeta;
  data: ISkillPost[];
}

export interface ITradePostSummary {
  id: string;
  title: string;
  slug?: string;
  tokenPrice?: number;
}

export interface ITradeUserSummary {
  id: string;
  name?: string;
  email?: string;
}

export interface IBarterRequest {
  id: string;
  senderId: string;
  receiverId: string;
  skillOfferedId?: string;
  skillRequestedId?: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  skillOffered?: ITradePostSummary;
  skillRequested?: ITradePostSummary;
  sender?: ITradeUserSummary;
  receiver?: ITradeUserSummary;
  createdAt?: string;
  message?: string;
}

export interface IMyTradesResponse {
  sentBarters: IBarterRequest[];
  receivedBarters: IBarterRequest[];
}
