import { afterEach, describe, expect, it, vi } from "vitest";

import { API_BASE_URL } from "../config/api";
import { login, refreshToken } from "./auth.service";

describe("Auth service", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should send user credentials to the login endpoint", async () => {
    const mockResponse = {
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
      tokenType: "Bearer",
      expiresIn: 900,
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await login({
      email: "user@example.com",
      password: "12345678",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/auth/login",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "user@example.com",
          password: "12345678",
        }),
      }),
    );

    expect(result).toEqual(mockResponse);
  });

  it("should reject invalid credentials with HTTP 401", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      login({
        email: "user@example.com",
        password: "wrong-password",
      }),
    ).rejects.toThrow("Invalid email or password");
  });

  it("should reject login when rate limit is exceeded", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      login({
        email: "user@example.com",
        password: "12345678",
      }),
    ).rejects.toThrow("Too many login attempts. Please try again later.");
  });

  it("should reject unexpected server errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      login({
        email: "user@example.com",
        password: "12345678",
      }),
    ).rejects.toThrow("Authentication failed");
  });

  it("should refresh the access token successfully", async () => {
    // Arrange
    const refreshTokenValue = "valid-refresh-token";

    const response = {
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      tokenType: "Bearer",
      expiresIn: 900,
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => response,
    });

    vi.stubGlobal("fetch", fetchMock);

    // Act
    const result = await refreshToken(refreshTokenValue);

    // Assert
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/v1/auth/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken: refreshTokenValue,
        }),
      },
    );

    expect(result).toEqual(response);
  });

  it("should reject an invalid refresh token with HTTP 401", async () => {
    // Arrange
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });

    vi.stubGlobal("fetch", fetchMock);

    // Act & Assert
    await expect(refreshToken("invalid-refresh-token")).rejects.toThrow(
      "Invalid or expired refresh token",
    );
  });
});
