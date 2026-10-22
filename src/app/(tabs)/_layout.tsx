import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, Stack } from "expo-router";

import { useAuth } from "../../contexts/AuthProvider";
import { canAccessProtectedRoutes } from "../../utils/auth-navigation";
import { COLORS } from "../../theme/colors";

export default function ProtectedLayout() {
  const { status, retry } = useAuth();

  if (status === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.message}>A verificar sessão...</Text>
      </View>
    );
  }

  if (status === "unauthenticated") {
    return <Redirect href="/login" />;
  }

  if (!canAccessProtectedRoutes(status)) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          Não foi possível verificar a sessão. Verifique a ligação à Internet.
        </Text>

        <Pressable
          style={styles.retryButton}
          onPress={() => void retry()}
          accessibilityRole="button"
        >
          <Text style={styles.retryText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  message: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 16,
  },
  retryButton: {
    marginTop: 20,
    padding: 12,
  },
  retryText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});
