import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { COLORS } from "../../theme/colors";

type AppButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export default function AppButton({
  title,
  onPress,
  loading = false,
  disabled = false,
}: AppButtonProps) {
  const isDisabled = loading || disabled;

  return (
    <Pressable
      style={[styles.button, isDisabled && styles.disabled]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.background} />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: "700",
  },
});
