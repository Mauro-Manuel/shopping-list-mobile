import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect } from "expo-router";

import { useAuth } from "../contexts/AuthProvider";
import { getAuthDestination } from "../utils/auth-navigation";
import { COLORS } from "../theme/colors";

export default function Index() {
  const { status, retry } = useAuth();

  if (status === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.message}>A verificar sessão...</Text>
      </View>
    );
  }

  const destination = getAuthDestination(status);

  if (destination) {
    return <Redirect href={destination} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.message}>
        Não foi possível verificar a sessão. Verifique a ligação à Internet.
      </Text>

      <Pressable onPress={() => void retry()} accessibilityRole="button">
        <Text style={styles.retry}>Tentar novamente</Text>
      </Pressable>
    </View>
  );
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
  retry: {
    marginTop: 20,
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});
