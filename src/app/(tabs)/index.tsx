import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getMyProfile } from "../../services/user.service";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../contexts/AuthProvider";
import { getShoppingLists } from "../../services/shopping-list.service";
import type { ShoppingListSummary } from "../../types/shopping-list";
import { COLORS } from "../../theme/colors";

export default function HomeScreen() {
  const { signOut } = useAuth();

  const [firstName, setFirstName] = useState<string | null>(null);
  const [lists, setLists] = useState<ShoppingListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getShoppingLists();
      setLists(response.content);
    } catch (error) {
      console.error("Failed to load shopping lists:", error);

      setError("Não foi possível carregar as listas de compras.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLists();
  }, [loadLists]);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const profile = await getMyProfile();

        const name = profile.name.trim().split(/\s+/)[0];

        if (active) {
          setFirstName(name || null);
        }
      } catch (error) {
        console.error("Failed to load user profile:", error);
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    if (loggingOut) return;

    try {
      setLoggingOut(true);

      await signOut();

      router.replace("/login");
    } catch {
      Alert.alert(
        "Erro",
        "Não foi possível terminar a sessão. Tente novamente.",
      );
    } finally {
      setLoggingOut(false);
    }
  }

  function renderList({ item }: { item: ShoppingListSummary }) {
    return (
      <Pressable
        style={styles.listCard}
        onPress={() => Alert.alert("Detalhes da Lista", `Lista: ${item.name}`)}
      >
        <View style={styles.listHeader}>
          <View style={styles.listTitleContainer}>
            <Text style={styles.listName}>{item.name}</Text>

            <Text style={styles.listInfo}>
              {item.checkedItems} de {item.totalItems} produtos comprados
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>

        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(100, Math.max(0, item.progress))}%`,
              },
            ]}
          />
        </View>

        <View style={styles.listFooter}>
          <Text style={styles.progressText}>{Math.round(item.progress)}%</Text>

          <Text
            style={[
              styles.status,
              item.status === "COMPLETED" && styles.completedStatus,
            ]}
          >
            {item.status === "ACTIVE" ? "Em andamento" : "Concluída"}
          </Text>
        </View>
      </Pressable>
    );
  }

  function renderContent() {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />

          <Text style={styles.message}>A carregar listas...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.center}>
          <View style={styles.stateIconContainer}>
            <Ionicons
              name="cloud-offline-outline"
              size={42}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.stateTitle}>Não foi possível carregar</Text>

          <Text style={styles.message}>
            Não conseguimos obter as tuas listas de compras. Verifica a ligação
            e tenta novamente.
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => void loadLists()}
            accessibilityRole="button"
          >
            <Ionicons name="refresh-outline" size={18} color={COLORS.primary} />

            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <FlatList
        data={lists}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          lists.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={
          <View style={styles.center}>
            <View style={styles.stateIconContainer}>
              <Ionicons
                name="basket-outline"
                size={42}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.stateTitle}>Ainda não tens listas</Text>

            <Text style={styles.message}>
              Cria a tua primeira lista e começa a organizar as tuas compras.
            </Text>
          </View>
        }
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>
              {firstName ? `Olá, ${firstName}! 👋` : "Olá! 👋"}
            </Text>

            <Text style={styles.title}>Minhas Listas</Text>

            <Text style={styles.subtitle}>Organiza as tuas compras</Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons name="cart-outline" size={25} color={COLORS.primary} />
          </View>
        </View>

        <View style={styles.content}>{renderContent()}</View>

        <View style={styles.footer}>
          <Pressable
            style={styles.newListButton}
            onPress={() =>
              Alert.alert(
                "Nova Lista",
                "Vamos implementar esta funcionalidade na próxima etapa.",
              )
            }
            accessibilityRole="button"
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />

            <Text style={styles.buttonText}>Nova Lista</Text>
          </Pressable>

          <Pressable
            style={styles.logoutButton}
            onPress={() => void handleLogout()}
            disabled={loggingOut}
            accessibilityRole="button"
          >
            <Ionicons name="log-out-outline" size={18} color="#6B7280" />

            <Text style={styles.logoutText}>
              {loggingOut ? "A terminar sessão..." : "Terminar sessão"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
    paddingHorizontal: 22,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingBottom: 24,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 27,
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#6B7280",
  },

  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#E9F8F1",
    justifyContent: "center",
    alignItems: "center",
  },

  content: {
    flex: 1,
  },

  listContent: {
    paddingTop: 6,
    paddingBottom: 20,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  listCard: {
    backgroundColor: "#F8FAF9",
    borderWidth: 1,
    borderColor: "#EDF0EE",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },

  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  listTitleContainer: {
    flex: 1,
    marginRight: 12,
  },

  listName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },

  listInfo: {
    marginTop: 7,
    fontSize: 13,
    color: "#6B7280",
  },

  progressBackground: {
    height: 7,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 18,
  },

  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },

  listFooter: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  progressText: {
    color: "#6B7280",
    fontSize: 12,
  },

  status: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 12,
  },

  completedStatus: {
    color: "#6B7280",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  stateIconContainer: {
    width: 82,
    height: 82,
    borderRadius: 24,
    backgroundColor: "#E9F8F1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22,
  },

  stateTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },

  message: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: "#6B7280",
    textAlign: "center",
  },

  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },

  retryText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },

  footer: {
    paddingTop: 12,
    paddingBottom: 12,
    gap: 14,
  },

  newListButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
  },

  logoutText: {
    color: "#6B7280",
    fontSize: 14,
  },
  greeting: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 8,
  },
});
