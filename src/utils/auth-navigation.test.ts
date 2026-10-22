import { describe, expect, it } from "vitest";

import {
  getAuthDestination,
  canAccessProtectedRoutes,
} from "./auth-navigation";

describe("Auth Navigation", () => {
  it("should navigate authenticated users to shopping lists", () => {
    // Arrange
    const status = "authenticated";

    // Act
    const destination = getAuthDestination(status);

    // Assert
    expect(destination).toBe("/(tabs)");
  });
  it("should navigate unauthenticated users to login", () => {
    // Arrange
    const status = "unauthenticated";

    // Act
    const destination = getAuthDestination(status);

    // Assert
    expect(destination).toBe("/login");
  });
  it("should not navigate when authentication status is unknown", () => {
    // Arrange
    const status = "unknown";

    // Act
    const destination = getAuthDestination(status);

    // Assert
    expect(destination).toBeNull();
  });
  it("should deny access to protected routes when user is unauthenticated", () => {
    // Arrange
    const status = "unauthenticated";

    // Act
    const canAccess = canAccessProtectedRoutes(status);

    // Assert
    expect(canAccess).toBe(false);
  });
  it("should allow access to protected routes when user is authenticated", () => {
    // Arrange
    const status = "authenticated";

    // Act
    const canAccess = canAccessProtectedRoutes(status);

    // Assert
    expect(canAccess).toBe(true);
  });

  it("should deny access to protected routes when authentication status is unknown", () => {
    // Arrange
    const status = "unknown";

    // Act
    const canAccess = canAccessProtectedRoutes(status);

    // Assert
    expect(canAccess).toBe(false);
  });
});
