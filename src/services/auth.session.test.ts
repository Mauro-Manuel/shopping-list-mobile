import { beforeEach, describe, expect, it, vi } from "vitest";

import { login, refreshToken } from "./auth.service";
import { getAuthTokens, saveAuthTokens, clearAuthTokens } from "./auth.storage";
import {
  loginAndSaveSession,
  restoreSession,
  refreshSession,
  checkAuthSession,
  logout,
} from "./auth.session";

vi.mock("./auth.service", () => ({
  login: vi.fn(),
  refreshToken: vi.fn(),
}));

vi.mock("./auth.storage", () => ({
  saveAuthTokens: vi.fn(),
  getAuthTokens: vi.fn(),
  clearAuthTokens: vi.fn(),
}));

describe("Auth Session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should save tokens after successful login", async () => {
    // Arrange
    const credentials = {
      email: "user@example.com",
      password: "password123",
    };

    const response = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      tokenType: "Bearer",
      expiresIn: 900,
    };

    vi.mocked(login).mockResolvedValue(response);

    // Act
    await loginAndSaveSession(credentials);

    // Assert
    expect(login).toHaveBeenCalledWith(credentials);

    expect(saveAuthTokens).toHaveBeenCalledWith({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });
  });

  it("should not save tokens when login fails", async () => {
    // Arrange
    const credentials = {
      email: "user@example.com",
      password: "wrong-password",
    };

    vi.mocked(login).mockRejectedValue(new Error("Invalid email or password"));

    // Act & Assert
    await expect(loginAndSaveSession(credentials)).rejects.toThrow(
      "Invalid email or password",
    );

    expect(login).toHaveBeenCalledWith(credentials);

    expect(saveAuthTokens).not.toHaveBeenCalled();
  });

  it("should restore a previously saved session", async () => {
    // Arrange
    const tokens = {
      accessToken: "saved-access-token",
      refreshToken: "saved-refresh-token",
    };

    vi.mocked(getAuthTokens).mockResolvedValue(tokens);

    // Act
    const session = await restoreSession();

    // Assert
    expect(getAuthTokens).toHaveBeenCalledOnce();
    expect(session).toEqual(tokens);
  });
  it("should return null when no session is stored", async () => {
    // Arrange
    vi.mocked(getAuthTokens).mockResolvedValue(null);

    // Act
    const session = await restoreSession();

    // Assert
    expect(getAuthTokens).toHaveBeenCalledOnce();
    expect(session).toBeNull();
  });

  it("should refresh the session and save new tokens", async () => {
    // Arrange
    const storedTokens = {
      accessToken: "expired-access-token",
      refreshToken: "valid-refresh-token",
    };

    const refreshedTokens = {
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      tokenType: "Bearer",
      expiresIn: 900,
    };

    vi.mocked(getAuthTokens).mockResolvedValue(storedTokens);
    vi.mocked(refreshToken).mockResolvedValue(refreshedTokens);

    // Act
    const result = await refreshSession();

    // Assert
    expect(refreshToken).toHaveBeenCalledWith(storedTokens.refreshToken);

    expect(saveAuthTokens).toHaveBeenCalledWith({
      accessToken: refreshedTokens.accessToken,
      refreshToken: refreshedTokens.refreshToken,
    });

    expect(result).toEqual({
      accessToken: refreshedTokens.accessToken,
      refreshToken: refreshedTokens.refreshToken,
    });
  });

  it("should return null without calling API when no session exists", async () => {
    // Arrange
    vi.mocked(getAuthTokens).mockResolvedValue(null);

    // Act
    const result = await refreshSession();

    // Assert
    expect(result).toBeNull();
    expect(refreshToken).not.toHaveBeenCalled();
    expect(saveAuthTokens).not.toHaveBeenCalled();
  });

  it("should clear stored tokens when refresh token is invalid", async () => {
    // Arrange
    const storedTokens = {
      accessToken: "expired-access-token",
      refreshToken: "invalid-refresh-token",
    };

    vi.mocked(getAuthTokens).mockResolvedValue(storedTokens);

    vi.mocked(refreshToken).mockRejectedValue(
      new Error("Invalid or expired refresh token"),
    );

    // Act & Assert
    await expect(refreshSession()).rejects.toThrow(
      "Invalid or expired refresh token",
    );

    expect(refreshToken).toHaveBeenCalledWith(storedTokens.refreshToken);
    expect(clearAuthTokens).toHaveBeenCalledOnce();
    expect(saveAuthTokens).not.toHaveBeenCalled();
  });

  it("should preserve stored tokens when token refresh fails due to network error", async () => {
    // Arrange
    const storedTokens = {
      accessToken: "expired-access-token",
      refreshToken: "valid-refresh-token",
    };

    vi.mocked(getAuthTokens).mockResolvedValue(storedTokens);

    vi.mocked(refreshToken).mockRejectedValue(
      new Error("Network request failed"),
    );

    // Act & Assert
    await expect(refreshSession()).rejects.toThrow("Network request failed");

    expect(refreshToken).toHaveBeenCalledWith(storedTokens.refreshToken);

    expect(clearAuthTokens).not.toHaveBeenCalled();
    expect(saveAuthTokens).not.toHaveBeenCalled();
  });

  it("should authenticate the user when session refresh succeeds", async () => {
    // Arrange
    const storedTokens = {
      accessToken: "expired-access-token",
      refreshToken: "valid-refresh-token",
    };

    const refreshedTokens = {
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      tokenType: "Bearer",
      expiresIn: 900,
    };

    vi.mocked(getAuthTokens).mockResolvedValue(storedTokens);
    vi.mocked(refreshToken).mockResolvedValue(refreshedTokens);

    // Act
    const result = await checkAuthSession();

    // Assert
    expect(result).toBe("authenticated");
    expect(refreshToken).toHaveBeenCalledWith(storedTokens.refreshToken);
    expect(saveAuthTokens).toHaveBeenCalledWith({
      accessToken: refreshedTokens.accessToken,
      refreshToken: refreshedTokens.refreshToken,
    });
  });

  it("should return unauthenticated when no session exists", async () => {
    // Arrange
    vi.mocked(getAuthTokens).mockResolvedValue(null);

    // Act
    const result = await checkAuthSession();

    // Assert
    expect(result).toBe("unauthenticated");
    expect(refreshToken).not.toHaveBeenCalled();
    expect(saveAuthTokens).not.toHaveBeenCalled();
  });

  it("should return unauthenticated when refresh token is invalid", async () => {
    // Arrange
    const storedTokens = {
      accessToken: "expired-access-token",
      refreshToken: "invalid-refresh-token",
    };

    vi.mocked(getAuthTokens).mockResolvedValue(storedTokens);

    vi.mocked(refreshToken).mockRejectedValue(
      new Error("Invalid or expired refresh token"),
    );

    // Act
    const result = await checkAuthSession();

    // Assert
    expect(result).toBe("unauthenticated");
    expect(refreshToken).toHaveBeenCalledWith(storedTokens.refreshToken);
    expect(clearAuthTokens).toHaveBeenCalledOnce();
    expect(saveAuthTokens).not.toHaveBeenCalled();
  });
  it("should return unknown when session validation fails due to network error", async () => {
    // Arrange
    const storedTokens = {
      accessToken: "expired-access-token",
      refreshToken: "valid-refresh-token",
    };

    vi.mocked(getAuthTokens).mockResolvedValue(storedTokens);

    vi.mocked(refreshToken).mockRejectedValue(
      new Error("Network request failed"),
    );

    // Act
    const result = await checkAuthSession();

    // Assert
    expect(result).toBe("unknown");

    expect(refreshToken).toHaveBeenCalledWith(storedTokens.refreshToken);

    expect(clearAuthTokens).not.toHaveBeenCalled();
    expect(saveAuthTokens).not.toHaveBeenCalled();
  });
  it("should clear stored tokens when user logs out", async () => {
    // Act
    await logout();

    // Assert
    expect(clearAuthTokens).toHaveBeenCalledOnce();
  });
});
