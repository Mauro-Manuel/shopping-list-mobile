import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { getProducts } from "../../services/product.service";
import {
  addShoppingItem,
  ShoppingItemConflictError,
} from "../../services/shopping-item.service";
import type { Product } from "../../types/product";
import { COLORS } from "../../theme/colors";

type Props = {
  visible: boolean;
  listId: number;
  onClose: () => void;
  onAdded: () => void;
};

const PAGE_SIZE = 20;

export default function AddShoppingItemModal({
  visible,
  listId,
  onClose,
  onAdded,
}: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!visible) return;

    let active = true;

    setSelectedProduct(null);
    setQuantity("1");
    setProducts([]);
    setPage(0);
    setHasMore(false);
    setError(null);
    setLoading(true);

    async function loadProducts() {
      try {
        const response = await getProducts(0, PAGE_SIZE, debouncedSearch);

        if (!active) return;

        setProducts(response.content.filter((product) => product.active));
        setHasMore(response.page.number + 1 < response.page.totalPages);
      } catch (error) {
        console.error("Failed to load products:", error);

        if (active) {
          setError("Não foi possível carregar os produtos.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProducts();

    return () => {
      active = false;
    };
  }, [visible, debouncedSearch]);

  async function loadMoreProducts() {
    if (loading || loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);

      const nextPage = page + 1;
      const response = await getProducts(nextPage, PAGE_SIZE, debouncedSearch);

      setProducts((current) => [
        ...current,
        ...response.content.filter((product) => product.active),
      ]);

      setPage(nextPage);
      setHasMore(response.page.number + 1 < response.page.totalPages);
    } catch (error) {
      console.error("Failed to load more products:", error);
      Alert.alert("Erro", "Não foi possível carregar mais produtos.");
    } finally {
      setLoadingMore(false);
    }
  }

  function closeModal() {
    if (saving) return;
    onClose();
  }

  async function handleAddProduct() {
    if (saving) return;

    if (!selectedProduct) {
      Alert.alert("Atenção", "Selecciona um produto.");
      return;
    }

    const parsedQuantity = Number(quantity.replace(",", "."));

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert("Atenção", "Introduz uma quantidade válida.");
      return;
    }

    try {
      setSaving(true);

      await addShoppingItem(listId, {
        productId: selectedProduct.id,
        quantity: parsedQuantity,
        unit: "UNIT",
      });

      onClose();
      onAdded();
    } catch (error) {
      if (error instanceof ShoppingItemConflictError) {
        Alert.alert(
          "Produto já adicionado",
          `${selectedProduct.name} já está na tua lista de compras.`,
        );
        return;
      }

      console.error("Failed to add product:", error);

      Alert.alert(
        "Erro",
        "Não foi possível adicionar o produto. Tenta novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={closeModal}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Adicionar Produto</Text>

            <Pressable
              onPress={closeModal}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <Ionicons name="close" size={25} color="#6B7280" />
            </Pressable>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#9CA3AF" />

            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar produto..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </Pressable>
            )}
          </View>

          <View style={styles.productsContainer}>
            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.hint}>A carregar produtos...</Text>
              </View>
            ) : error ? (
              <View style={styles.center}>
                <Text style={styles.hint}>{error}</Text>

                <Pressable onPress={closeModal}>
                  <Text style={styles.linkText}>Fechar</Text>
                </Pressable>
              </View>
            ) : (
              <FlatList
                data={products}
                keyExtractor={(item) => String(item.id)}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Text style={styles.hint}>
                    Não existem produtos disponíveis nesta página.
                  </Text>
                }
                renderItem={({ item }) => {
                  const selected = selectedProduct?.id === item.id;

                  return (
                    <Pressable
                      style={[
                        styles.productRow,
                        selected && styles.selectedRow,
                      ]}
                      onPress={() => setSelectedProduct(item)}
                    >
                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>{item.name}</Text>

                        <Text style={styles.categoryName}>
                          {item.category.name}
                        </Text>
                      </View>

                      <Ionicons
                        name={selected ? "checkmark-circle" : "ellipse-outline"}
                        size={24}
                        color={selected ? COLORS.primary : "#9CA3AF"}
                      />
                    </Pressable>
                  );
                }}
                ListFooterComponent={
                  hasMore ? (
                    <Pressable
                      style={styles.loadMoreButton}
                      onPress={() => void loadMoreProducts()}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <ActivityIndicator color={COLORS.primary} />
                      ) : (
                        <Text style={styles.linkText}>
                          Carregar mais produtos
                        </Text>
                      )}
                    </Pressable>
                  ) : undefined
                }
              />
            )}
          </View>

          <Text style={styles.label}>Quantidade</Text>

          <View style={styles.quantityRow}>
            <TextInput
              style={styles.quantityInput}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
              editable={!saving}
              selectTextOnFocus
              accessibilityLabel="Quantidade"
            />

            <View style={styles.unitBox}>
              <Text style={styles.unitText}>Unidade (UNIT)</Text>
            </View>
          </View>

          <Pressable
            style={[styles.addButton, saving && styles.disabledButton]}
            onPress={() => void handleAddProduct()}
            disabled={saving || loading || !!error}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="add" size={22} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Adicionar à Lista</Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={styles.cancelButton}
            onPress={closeModal}
            disabled={saving}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 36,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  title: {
    fontSize: 21,
    fontWeight: "700",
    color: "#111827",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  productsContainer: {
    maxHeight: 230,
    minHeight: 100,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    overflow: "hidden",
  },
  center: {
    padding: 20,
    alignItems: "center",
    gap: 12,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  selectedRow: {
    backgroundColor: "#E9F8F1",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  categoryName: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  hint: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
  loadMoreButton: {
    padding: 14,
    alignItems: "center",
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  quantityRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 22,
  },
  quantityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },
  unitBox: {
    justifyContent: "center",
    paddingHorizontal: 14,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
  },
  unitText: {
    fontSize: 13,
    color: "#374151",
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    alignItems: "center",
    padding: 14,
  },
  cancelText: {
    fontSize: 15,
    color: "#6B7280",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    gap: 10,
  },

  searchInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: "#111827",
  },
});
