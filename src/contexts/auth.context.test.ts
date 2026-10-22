import { describe, expect, it, vi } from "vitest";

import {
  getInitialAuthStatus,
  resolveAuthStatus,
  createAuthSessionInitializer,
} from "./auth.context";

import { checkAuthSession } from "../services/auth.session";

vi.mock("../services/auth.session", () => ({
  checkAuthSession: vi.fn(),
}));

describe("Auth Context", () => {
  it("should start with an unverified authentication status", () => {
    // Act
    const status = getInitialAuthStatus();

    // Assert
    expect(status).toBeNull();
  });
  it("should resolve the initial authentication status", async () => {
    // Arrange
    vi.mocked(checkAuthSession).mockResolvedValue("authenticated");

    // Act
    const status = await resolveAuthStatus();

    // Assert
    expect(status).toBe("authenticated");
    expect(checkAuthSession).toHaveBeenCalledOnce();
  });
  it("should initialize authentication only once", async () => {
    // Arrange
    vi.mocked(checkAuthSession).mockResolvedValue("authenticated");

    const initialize = createAuthSessionInitializer();

    // Act
    const firstResult = await initialize();
    const secondResult = await initialize();

    // Assert
    expect(firstResult).toBe("authenticated");
    expect(secondResult).toBe("authenticated");
    expect(checkAuthSession).toHaveBeenCalledOnce();
  });
});
