import { FALLBACK_API_URL } from "../constants/config";

const DEFAULT_API_PATH = "/api/v1";

export const resolveApiBaseUrl = () => {
  // Use Expo's env variables
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (configuredUrl) {
    return configuredUrl;
  }

  // Fallback for local development
  return `${FALLBACK_API_URL}${DEFAULT_API_PATH}`;
};

export const resolveSocketBaseUrl = () => {
  const configuredUrl = process.env.EXPO_PUBLIC_SOCKET_URL?.trim();

  if (configuredUrl) {
    return configuredUrl;
  }

  const apiBaseUrl = resolveApiBaseUrl();
  if (apiBaseUrl.endsWith(DEFAULT_API_PATH)) {
    return apiBaseUrl.slice(0, -DEFAULT_API_PATH.length);
  }

  return FALLBACK_API_URL;
};
