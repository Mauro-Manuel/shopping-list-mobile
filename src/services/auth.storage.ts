import * as SecureStore from "expo-secure-store";

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export async function saveAuthTokens(tokens: AuthTokens): Promise<void> {
  await SecureStore.setItemAsync("accessToken", tokens.accessToken);
  await SecureStore.setItemAsync("refreshToken", tokens.refreshToken);
}

export async function getAuthTokens(): Promise<AuthTokens | null> {
  const accessToken = await SecureStore.getItemAsync("accessToken");
  const refreshToken = await SecureStore.getItemAsync("refreshToken");

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
  };
}

export async function clearAuthTokens(): Promise<void> {
  await SecureStore.deleteItemAsync("accessToken");
  await SecureStore.deleteItemAsync("refreshToken");
}
