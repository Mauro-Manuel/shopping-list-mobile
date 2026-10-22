import { login, refreshToken } from "./auth.service";
import { getAuthTokens, saveAuthTokens, clearAuthTokens } from "./auth.storage";

type LoginCredentials = {
  email: string;
  password: string;
};

export async function loginAndSaveSession(
  credentials: LoginCredentials,
): Promise<void> {
  const response = await login(credentials);

  await saveAuthTokens({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
  });
}

export async function restoreSession() {
  return getAuthTokens();
}

export async function refreshSession() {
  const storedTokens = await getAuthTokens();

  if (!storedTokens) {
    return null;
  }

  try {
    const response = await refreshToken(storedTokens.refreshToken);

    const newTokens = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    };

    await saveAuthTokens(newTokens);

    return newTokens;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Invalid or expired refresh token"
    ) {
      await clearAuthTokens();
    }

    throw error;
  }
}

export async function checkAuthSession(): Promise<
  "authenticated" | "unauthenticated" | "unknown"
> {
  try {
    const tokens = await refreshSession();

    return tokens ? "authenticated" : "unauthenticated";
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Invalid or expired refresh token"
    ) {
      return "unauthenticated";
    }

    return "unknown";
  }
}

export async function logout(): Promise<void> {
  await clearAuthTokens();
}
