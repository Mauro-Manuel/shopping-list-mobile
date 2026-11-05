import { beforeEach, describe, expect, it, vi } from "vitest";

import { authFetch, setUnauthenticatedHandler } from "./auth.client";
import { getAuthTokens, clearAuthTokens } from "./auth.storage";
import { refreshSession } from "./auth.session";

vi.mock("./auth.storage", () => ({
  getAuthTokens: vi.fn(),
  clearAuthTokens: vi.fn(),
}));

vi.mock("./auth.session", () => ({
  refreshSession: vi.fn(),
}));

describe("authFetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    setUnauthenticatedHandler(null);
  });

  it("sends the access token in authenticated requests", async () => {
    vi.mocked(getAuthTokens).mockResolvedValue({
      accessToken: "valid-token",
      refreshToken: "refresh-token",
    });

    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));

    const response = await authFetch("https://example.test/lists");

    expect(response.status).toBe(200);
    expect(refreshSession).not.toHaveBeenCalled();

    const request = vi.mocked(fetch).mock.calls[0];
    const headers = new Headers(request[1]?.headers);

    expect(headers.get("Authorization")).toBe("Bearer valid-token");
  });

  it("refreshes the token after 401 and retries once", async () => {
    const oldTokens = {
      accessToken: "expired-token",
      refreshToken: "refresh-token",
    };

    vi.mocked(getAuthTokens).mockResolvedValue(oldTokens);

    vi.mocked(refreshSession).mockResolvedValue({
      accessToken: "new-token",
      refreshToken: "new-refresh-token",
    });

    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    const response = await authFetch("https://example.test/lists");

    expect(response.status).toBe(200);
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(2);

    const retryRequest = vi.mocked(fetch).mock.calls[1];
    const headers = new Headers(retryRequest[1]?.headers);

    expect(headers.get("Authorization")).toBe("Bearer new-token");
  });

  it("notifies the app when the refresh token is invalid", async () => {
    const onExpired = vi.fn();
    setUnauthenticatedHandler(onExpired);

    vi.mocked(getAuthTokens).mockResolvedValue({
      accessToken: "expired-token",
      refreshToken: "invalid-refresh-token",
    });

    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 401 }));

    vi.mocked(refreshSession).mockRejectedValue(
      new Error("Invalid or expired refresh token"),
    );

    await expect(authFetch("https://example.test/lists")).rejects.toThrow(
      "Session expired",
    );

    expect(onExpired).toHaveBeenCalledOnce();
  });

  it("does not sign out when the refresh fails due to network errors", async () => {
    const onExpired = vi.fn();
    setUnauthenticatedHandler(onExpired);

    vi.mocked(getAuthTokens).mockResolvedValue({
      accessToken: "expired-token",
      refreshToken: "refresh-token",
    });

    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 401 }));

    vi.mocked(refreshSession).mockRejectedValue(
      new TypeError("Network request failed"),
    );

    await expect(authFetch("https://example.test/lists")).rejects.toThrow(
      "Network request failed",
    );

    expect(onExpired).not.toHaveBeenCalled();
  });

  it("does not retry indefinitely when the refreshed token is rejected", async () => {
    vi.mocked(getAuthTokens).mockResolvedValue({
      accessToken: "expired-token",
      refreshToken: "refresh-token",
    });

    vi.mocked(refreshSession).mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
    });

    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }));

    await expect(authFetch("https://example.test/lists")).rejects.toThrow(
      "Unauthorized after token refresh",
    );

    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("shares a single refresh for simultaneous 401 responses", async () => {
    const oldTokens = {
      accessToken: "expired-token",
      refreshToken: "old-refresh-token",
    };

    const newTokens = {
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
    };

    let currentTokens = oldTokens;

    vi.mocked(getAuthTokens).mockImplementation(async () => currentTokens);

    let resolveRefresh!: (tokens: typeof newTokens) => void;

    const pendingRefresh = new Promise<typeof newTokens>((resolve) => {
      resolveRefresh = resolve;
    });

    vi.mocked(refreshSession).mockImplementation(async () => {
      const tokens = await pendingRefresh;
      currentTokens = tokens;
      return tokens;
    });

    vi.mocked(fetch).mockImplementation(async (_url, init) => {
      const headers = new Headers(init?.headers);

      return new Response(null, {
        status:
          headers.get("Authorization") === "Bearer expired-token" ? 401 : 200,
      });
    });

    const requests = Promise.all([
      authFetch("https://example.test/lists"),
      authFetch("https://example.test/categories"),
    ]);

    await vi.waitFor(() => {
      expect(refreshSession).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    resolveRefresh(newTokens);

    const responses = await requests;

    expect(responses.map((response) => response.status)).toEqual([200, 200]);

    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(4);
  });

  it("ends the session when the refreshed token is also rejected", async () => {
    const expiredTokens = {
      accessToken: "expired-access-token",
      refreshToken: "old-refresh-token",
    };

    const refreshedTokens = {
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
    };

    const onSessionExpired = vi.fn();

    setUnauthenticatedHandler(onSessionExpired);

    vi.mocked(getAuthTokens)
      .mockResolvedValueOnce(expiredTokens)
      .mockResolvedValueOnce(expiredTokens)
      .mockResolvedValueOnce(refreshedTokens);

    vi.mocked(refreshSession).mockResolvedValue(refreshedTokens);

    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }));

    await expect(authFetch("https://example.test/lists")).rejects.toThrow(
      "Unauthorized after token refresh",
    );

    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(clearAuthTokens).toHaveBeenCalledTimes(1);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });
});
