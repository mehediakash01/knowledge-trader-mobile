import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const AUTH_USER_KEY = "authUser";

const setTokenAsync = async (key: string, token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, token);
  } catch (error) {
    console.warn(`Failed to set token for ${key}`, error);
  }
};

const getTokenAsync = async (key: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.warn(`Failed to get token for ${key}`, error);
    return null;
  }
};

const removeTokenAsync = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.warn(`Failed to remove token for ${key}`, error);
  }
};

export const authKey = {
  accessToken: ACCESS_TOKEN_KEY,
  refreshToken: REFRESH_TOKEN_KEY,
  authUser: AUTH_USER_KEY,
} as const;

export const getAccessToken = async (): Promise<string | null> => await getTokenAsync(ACCESS_TOKEN_KEY);

export const setAccessToken = async (token: string): Promise<void> => {
  await setTokenAsync(ACCESS_TOKEN_KEY, token);
};

export const removeAccessToken = async (): Promise<void> => {
  await removeTokenAsync(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = async (): Promise<string | null> => await getTokenAsync(REFRESH_TOKEN_KEY);

export const setRefreshToken = async (token: string): Promise<void> => {
  await setTokenAsync(REFRESH_TOKEN_KEY, token);
};

export const removeRefreshToken = async (): Promise<void> => {
  await removeTokenAsync(REFRESH_TOKEN_KEY);
};

export const getAuthUser = async <TUser>(): Promise<TUser | null> => {
  const rawUser = await getTokenAsync(AUTH_USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as TUser;
  } catch {
    await removeTokenAsync(AUTH_USER_KEY);
    return null;
  }
};

export const setAuthUser = async <TUser>(user: TUser): Promise<void> => {
  await setTokenAsync(AUTH_USER_KEY, JSON.stringify(user));
};

export const removeAuthUser = async (): Promise<void> => {
  await removeTokenAsync(AUTH_USER_KEY);
};

export const setAuthTokens = async ({
  accessToken,
  refreshToken,
}: {
  accessToken?: string | null;
  refreshToken?: string | null;
}): Promise<void> => {
  if (accessToken === null) {
    await removeAccessToken();
  } else if (accessToken) {
    await setAccessToken(accessToken);
  }

  if (refreshToken === null) {
    await removeRefreshToken();
  } else if (refreshToken) {
    await setRefreshToken(refreshToken);
  }
};

export const removeAuthTokens = async (): Promise<void> => {
  await removeAccessToken();
  await removeRefreshToken();
};

export const clearAuthStorage = async (): Promise<void> => {
  await removeAuthTokens();
  await removeAuthUser();
};
