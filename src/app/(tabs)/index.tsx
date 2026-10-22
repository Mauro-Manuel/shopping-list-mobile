import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import { useAuth } from "../../contexts/AuthProvider";
import { COLORS } from "../../theme/colors";

export default function HomeScreen() {
  const { signOut } = useAuth();

  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;

    try {
      setLoading(true);
      await signOut();

      router.replace("/login");
    } catch {
      Alert.alert(
        "Erro",
        "Não foi possível terminar a sessão. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Minhas Listas</Text>

      <Text style={styles.subtitle}>
        Esta funcionalidade será implementada em breve.
      </Text>

      <Pressable
        style={styles.logoutButton}
        onPress={handleLogout}
        disabled={loading}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.logoutText}>Terminar sessão</Text>
        )}
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    marginTop: 12,
    textAlign: "center",
  },
  logoutButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 32,
    minWidth: 180,
    alignItems: "center",
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
