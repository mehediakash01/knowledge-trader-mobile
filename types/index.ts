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
  reputationScore?: number;
}

export interface IApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: any;
}

export interface ISkillPost {
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
