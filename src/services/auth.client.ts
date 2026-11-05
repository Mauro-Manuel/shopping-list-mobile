import { getAuthTokens, clearAuthTokens } from "./auth.storage";
import { refreshSession } from "./auth.session";

type AuthTokens = NonNullable<Awaited<ReturnType<typeof getAuthTokens>>>;

let refreshPromise: Promise<AuthTokens | null> | null = null;

let unauthenticatedHandler: (() => void) | null = null;

export function setUnauthenticatedHandler(handler: (() => void) | null): void {
  unauthenticatedHandler = handler;
}

async function refreshOnce(): Promise<AuthTokens | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        return await refreshSession();
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

function withAuthorization(
  init: RequestInit,
  accessToken: string,
): RequestInit {
  const headers = new Headers(init.headers);

  headers.set("Authorization", `Bearer ${accessToken}`);

  return {
    ...init,
    headers,
  };
}

function notifySessionExpired(): void {
  unauthenticatedHandler?.();
}

export async function authFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const tokens = await getAuthTokens();

  if (!tokens) {
    notifySessionExpired();
    throw new Error("Authentication required");
  }

  // Primeira tentativa com o access token actual.
  const response = await fetch(
    url,
    withAuthorization(init, tokens.accessToken),
  );

  if (response.status !== 401) {
    return response;
  }

  // Outra requisição pode já ter renovado os tokens.
  const latestTokens = await getAuthTokens();

  if (!latestTokens) {
    notifySessionExpired();
    throw new Error("Session expired");
  }

  let validTokens = latestTokens;

  if (latestTokens.accessToken === tokens.accessToken) {
    try {
      // Uma única renovação para pedidos simultâneos.
      const refreshed = await refreshOnce();

      if (!refreshed) {
        notifySessionExpired();
        throw new Error("Session expired");
      }

      validTokens = refreshed;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Invalid or expired refresh token"
      ) {
        notifySessionExpired();
        throw new Error("Session expired");
      }

      // Falhas de Internet ou do servidor não fazem logout.
      throw error;
    }
  }

  // Repetir a requisição apenas uma vez.
  const retryResponse = await fetch(
    url,
    withAuthorization(init, validTokens.accessToken),
  );

  if (retryResponse.status === 401) {
    const currentTokens = await getAuthTokens();

    // Só limpar se ainda estivermos a utilizar
    // o token que acabou de ser rejeitado.
    if (currentTokens?.accessToken === validTokens.accessToken) {
      await clearAuthTokens();
      notifySessionExpired();
    } else if (!currentTokens) {
      // Outra operação já removeu a sessão.
      notifySessionExpired();
    }

    throw new Error("Unauthorized after token refresh");
  }

  return retryResponse;
}
