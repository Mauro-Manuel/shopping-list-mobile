
import { describe, expect, it } from "vitest";

import {
  isRequired,
  isValidEmail,
  passwordsMatch,
} from "./validation";

describe("Validation utilities", () => {
  describe("isValidEmail", () => {
    it("should accept a valid email", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
    });

    it("should reject an invalid email", () => {
      expect(isValidEmail("invalid-email")).toBe(false);
    });

    it("should trim whitespace before validating email", () => {
      expect(isValidEmail("  user@example.com  ")).toBe(true);
    });

    it("should reject an empty email", () => {
      expect(isValidEmail("")).toBe(false);
    });
  });

  describe("isRequired", () => {
    it("should accept a non-empty value", () => {
      expect(isRequired("Milk")).toBe(true);
    });

    it("should reject an empty value", () => {
      expect(isRequired("")).toBe(false);
    });

    it("should reject whitespace-only values", () => {
      expect(isRequired("   ")).toBe(false);
    });
  });

  describe("passwordsMatch", () => {
    it("should accept matching passwords", () => {
      expect(passwordsMatch("12345678", "12345678")).toBe(true);
    });

    it("should reject different passwords", () => {
      expect(passwordsMatch("12345678", "87654321")).toBe(false);
    });
  });
});
