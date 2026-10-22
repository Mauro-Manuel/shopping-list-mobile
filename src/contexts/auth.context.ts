import { checkAuthSession } from "../services/auth.session";
import type { AuthStatus } from "../utils/auth-navigation";

export type AuthContextStatus = AuthStatus | null;

export function getInitialAuthStatus(): AuthContextStatus {
  return null;
}

export async function resolveAuthStatus(): Promise<AuthStatus> {
  return checkAuthSession();
}

export function createAuthSessionInitializer(): () => Promise<AuthStatus> {
  let initializationPromise: Promise<AuthStatus> | null = null;

  return () => {
    if (!initializationPromise) {
      initializationPromise = resolveAuthStatus();
    }

    return initializationPromise;
  };
}