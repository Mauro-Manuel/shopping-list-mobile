export type AuthStatus = "authenticated" | "unauthenticated" | "unknown";

export function getAuthDestination(
  status: AuthStatus,
): "/(tabs)" | "/login" | null {
  if (status === "authenticated") {
    return "/(tabs)";
  }

  if (status === "unauthenticated") {
    return "/login";
  }

  return null;
}

export function canAccessProtectedRoutes(status: AuthStatus): boolean {
  return status === "authenticated";
}
