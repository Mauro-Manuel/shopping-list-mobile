import { beforeEach, describe, expect, it, vi } from "vitest";
import * as SecureStore from "expo-secure-store";

import { saveAuthTokens, getAuthTokens, clearAuthTokens } from "./auth.storage";

vi.mock("expo-secure-store", () => ({
  setItemAsync: vi.fn(),
  getItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

describe("Auth Storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should securely store access and refresh tokens", async () => {
    // Arrange
    const tokens = {
      accessToken: "access-token-example",
      refreshToken: "refresh-token-example",
    };

    // Act
    await saveAuthTokens(tokens);

    // Assert
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(2);

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "accessToken",
      tokens.accessToken,
    );

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "refreshToken",
      tokens.refreshToken,
    );
  });

  it("should retrieve stored access and refresh tokens", async () => {
    // Arrange
    vi.mocked(SecureStore.getItemAsync)
      .mockResolvedValueOnce("access-token-example")
      .mockResolvedValueOnce("refresh-token-example");

    // Act
    const tokens = await getAuthTokens();

    // Assert
    expect(SecureStore.getItemAsync).toHaveBeenNthCalledWith(1, "accessToken");

    expect(SecureStore.getItemAsync).toHaveBeenNthCalledWith(2, "refreshToken");

    expect(tokens).toEqual({
      accessToken: "access-token-example",
      refreshToken: "refresh-token-example",
    });
  });

  it("should return null when auth tokens are missing", async () => {
    // Arrange
    vi.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

    // Act
    const tokens = await getAuthTokens();

    // Assert
    expect(tokens).toBeNull();
  });

  it("should remove access and refresh tokens on logout", async () => {
    // Act
    await clearAuthTokens();

    // Assert
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(2);

    expect(SecureStore.deleteItemAsync).toHaveBeenNthCalledWith(
      1,
      "accessToken",
    );

    expect(SecureStore.deleteItemAsync).toHaveBeenNthCalledWith(
      2,
      "refreshToken",
    );
  });
});
