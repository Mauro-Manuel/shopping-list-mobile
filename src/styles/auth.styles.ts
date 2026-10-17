import { StyleSheet } from "react-native";

import { COLORS } from "../theme/colors";
import { SPACING } from "../theme/spacing";
import { TYPOGRAPHY } from "../theme/typography";

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.xxxl,
  },
  brand: {
    alignItems: "center",
    marginBottom: 50,
  },
  title: {
    marginTop: SPACING.lg,
    fontSize: TYPOGRAPHY.title,
    fontWeight: "700",
    color: COLORS.text,
  },
  subtitle: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.subtitle,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 21,
  },
  form: {
    width: "100%",
  },
  label: {
    fontSize: TYPOGRAPHY.label,
    fontWeight: "600",
    color: "#334155",
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 22,
    gap: 10,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: TYPOGRAPHY.body,
    color: COLORS.text,
    paddingVertical: SPACING.md,
  },
  loginButton: {
    minHeight: 54,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.md,
  },
  loginButtonText: {
    color: COLORS.background,
    fontSize: TYPOGRAPHY.button,
    fontWeight: "700",
  },
  registerContainer: {
    alignItems: "center",
    marginTop: SPACING.xxl,
    gap: SPACING.sm,
  },
  registerText: {
    fontSize: TYPOGRAPHY.subtitle,
    color: COLORS.textSecondary,
  },
  registerLink: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.body,
    fontWeight: "700",
  },
});
