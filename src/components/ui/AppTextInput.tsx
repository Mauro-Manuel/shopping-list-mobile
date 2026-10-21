
import { ReactNode, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "../../theme/colors";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type AppTextInputProps = TextInputProps & {
  label: string;
  icon?: IconName;
  error?: string;
  isPassword?: boolean;
};

export default function AppTextInput({
  label,
  icon,
  error,
  isPassword = false,
  secureTextEntry,
  ...inputProps
}: AppTextInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.inputContainer,
          error ? styles.inputError : undefined,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={COLORS.textSecondary}
          />
        )}

        <TextInput
          {...inputProps}
          style={styles.input}
          placeholderTextColor={COLORS.placeholder}
          secureTextEntry={
            isPassword ? !showPassword : secureTextEntry
          }
        />

        {isPassword && (
          <Pressable
            onPress={() => setShowPassword((previous) => !previous)}
            accessibilityRole="button"
            accessibilityLabel={
              showPassword
                ? "Ocultar palavra-passe"
                : "Mostrar palavra-passe"
            }
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={21}
              color={COLORS.textSecondary}
            />
          </Pressable>
        )}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },
  inputContainer: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 12,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.error,
  },
});
