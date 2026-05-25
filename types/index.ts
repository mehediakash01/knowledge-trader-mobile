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
}
