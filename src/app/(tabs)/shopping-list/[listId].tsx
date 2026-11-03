import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import AddShoppingItemModal from "../../../components/shopping-list/AddShoppingItemModal";
import { getShoppingListById } from "../../../services/shopping-list.service";
import {
  checkShoppingItem,
  uncheckShoppingItem,
} from "../../../services/shopping-item.service";
import type {
  ShoppingListDetails,
  ShoppingListItem,
} from "../../../types/shopping-list";
import { COLORS } from "../../../theme/colors";

export default function ShoppingListDetailsScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const [list, setList] = useState<ShoppingListDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [checkingItemId, setCheckingItemId] = useState<number | null>(null);
  const checkingRef = useRef(false);

  const loadDetails = useCallback(
    async (showLoading = true) => {
      const id = Number(listId);

      if (!Number.isSafeInteger(id) || id <= 0) {
        setError("Identificador da lista inválido.");
        setLoading(false);
        return;
      }

      try {
        if (showLoading) setLoading(true);
        setError(null);
        const response = await getShoppingListById(id);
        setList(response);
      } catch (caughtError) {
        console.error("Failed to load shopping list:", caughtError);
        setError("Não foi possível carregar os detalhes da lista.");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [listId],
  );

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  async function handleCheckItem(item: ShoppingListItem) {
    if (!list || checkingItemId !== null || list.status !== "ACTIVE") {
      return;
    }

    try {
      setCheckingItemId(item.id);

      if (item.checked) {
        await uncheckShoppingItem(list.id, item.id);
      } else {
        await checkShoppingItem(list.id, item.id);
      }

      await loadDetails();
    } catch (error) {
      console.error("Failed to update shopping item:", error);

      Alert.alert(
        "Erro",
        "Não foi possível actualizar o estado do produto. Tenta novamente.",
      );
    } finally {
      setCheckingItemId(null);
    }
  }

  function renderItem({ item }: { item: ShoppingListItem }) {
    const isUpdating = checkingItemId === item.id;
    const isDisabled = checkingItemId !== null || list?.status !== "ACTIVE";

    return (
      <Pressable
        style={styles.itemCard}
        onPress={() => void handleCheckItem(item)}
        disabled={isDisabled}
        accessibilityRole="checkbox"
        accessibilityState={{
          checked: item.checked,
          disabled: isDisabled,
        }}
        accessibilityLabel={`${item.product.name}, ${
          item.checked ? "comprado" : "pendente"
        }`}
      >
        {isUpdating ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <Ionicons
            name={item.checked ? "checkbox" : "square-outline"}
            size={24}
            color={COLORS.primary}
          />
        )}

        <View style={styles.itemInfo}>
          <Text
            style={[styles.itemName, item.checked && styles.checkedItemName]}
          >
            {item.product.name}
          </Text>

          <Text style={styles.itemSubtitle}>
            {item.quantity} {item.unit} · {item.category.name}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="arrow-back" size={26} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>Detalhes da Lista</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.message}>A carregar lista...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.message}>{error}</Text>
            <Pressable
              onPress={() => void loadDetails()}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : list ? (
          <>
            <View style={styles.summary}>
              <Text style={styles.listName}>{list.name}</Text>
              <Text style={styles.progressLabel}>
                {list.checkedItems} de {list.totalItems} produtos comprados
              </Text>
              <View style={styles.progressBackground}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, Math.max(0, list.progress))}%` },
                  ]}
                />
              </View>
              <Text style={styles.status}>
                {list.status === "ACTIVE" ? "Em andamento" : "Concluída"}
              </Text>
            </View>

            <FlatList
              data={list.items}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.center}>
                  <Ionicons
                    name="basket-outline"
                    size={58}
                    color={COLORS.primary}
                  />
                  <Text style={styles.emptyTitle}>
                    Esta lista ainda está vazia
                  </Text>
                  <Text style={styles.message}>
                    Adiciona os produtos que precisas de comprar.
                  </Text>
                </View>
              }
            />

            {list.status === "ACTIVE" && (
              <Pressable
                style={styles.addButton}
                onPress={() => setAddModalVisible(true)}
                accessibilityRole="button"
              >
                <Ionicons name="add" size={23} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Adicionar Produto</Text>
              </Pressable>
            )}
          </>
        ) : null}
      </View>

      <AddShoppingItemModal
        visible={addModalVisible}
        listId={Number(listId)}
        onClose={() => setAddModalVisible(false)}
        onAdded={() => void loadDetails(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1, paddingHorizontal: 22 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingTop: 18,
    paddingBottom: 26,
  },
  headerTitle: { fontSize: 19, fontWeight: "700", color: "#111827" },
  summary: {
    backgroundColor: "#F8FAF9",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  listName: { fontSize: 24, fontWeight: "700", color: "#111827" },
  progressLabel: { fontSize: 14, color: "#6B7280", marginTop: 10 },
  progressBackground: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 14,
  },
  progressFill: { height: "100%", backgroundColor: COLORS.primary },
  status: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 12,
  },
  listContent: { flexGrow: 1, paddingBottom: 20 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111827",
    marginTop: 20,
    textAlign: "center",
  },
  message: {
    marginTop: 10,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 21,
  },
  retryButton: { marginTop: 20, padding: 12 },
  retryText: { color: COLORS.primary, fontWeight: "600" },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#F8FAF9",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: "600", color: "#111827" },
  checkedItemName: { textDecorationLine: "line-through", color: "#9CA3AF" },
  itemSubtitle: { color: "#6B7280", fontSize: 13, marginTop: 5 },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
