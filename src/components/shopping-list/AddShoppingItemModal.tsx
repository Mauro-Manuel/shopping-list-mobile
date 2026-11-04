import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { getProducts } from "../../services/product.service";
import { getCategories } from "../../services/category.service";
import {
  addShoppingItem,
  ShoppingItemConflictError,
} from "../../services/shopping-item.service";

import type { Product } from "../../types/product";
import type { Category } from "../../types/category";
import { UNITS, type Unit } from "../../types/unit";
import { COLORS } from "../../theme/colors";

type Props = {
  visible: boolean;
  listId: number;
  onClose: () => void;
  onAdded: () => void;
};

type ProductMode = "existing" | "new";

const PAGE_SIZE = 20;

export default function AddShoppingItemModal({
  visible,
  listId,
  onClose,
  onAdded,
}: Props) {
  // Product mode
  const [productMode, setProductMode] = useState<ProductMode>("existing");

  // Existing products
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [productReload, setProductReload] = useState(0);

  // New product
  const [newProductName, setNewProductName] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoryReload, setCategoryReload] = useState(0);

  // Shared fields
  const [quantity, setQuantity] = useState("1");
  const [selectedUnit, setSelectedUnit] = useState<Unit>("UNIT");
  const [saving, setSaving] = useState(false);

  // Reset form whenever modal opens
  useEffect(() => {
    if (!visible) return;

    setProductMode("existing");

    setProducts([]);
    setSelectedProduct(null);
    setSearch("");
    setDebouncedSearch("");
    setPage(0);
    setHasMore(false);
    setProductsError(null);

    setNewProductName("");
    setCategories([]);
    setSelectedCategoryId(null);
    setCategoriesError(null);

    setQuantity("1");
    setSelectedUnit("UNIT");
  }, [visible]);

  // Search debounce
  useEffect(() => {
    if (!visible) return;

    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(timeout);
  }, [visible, search]);

  const searchPending = search.trim() !== debouncedSearch;

  // Load existing products
  useEffect(() => {
    if (!visible || productMode !== "existing") return;

    let active = true;

    setLoadingProducts(true);
    setProductsError(null);
    setProducts([]);
    setPage(0);
    setHasMore(false);
    setSelectedProduct(null);

    async function loadProducts() {
      try {
        const response = await getProducts(0, PAGE_SIZE, debouncedSearch);

        if (!active) return;

        setProducts(response.content.filter((product) => product.active));

        setPage(response.page.number);
        setHasMore(response.page.number + 1 < response.page.totalPages);
      } catch (error) {
        console.error("Failed to load products:", error);

        if (active) {
          setProductsError("Não foi possível carregar os produtos.");
        }
      } finally {
        if (active) {
          setLoadingProducts(false);
        }
      }
    }

    void loadProducts();

    return () => {
      active = false;
    };
  }, [visible, productMode, debouncedSearch, productReload]);

  // Load more products
  async function loadMoreProducts() {
    if (loadingProducts || loadingMore || !hasMore || searchPending) {
      return;
    }

    const nextPage = page + 1;
    const currentSearch = debouncedSearch;

    try {
      setLoadingMore(true);

      const response = await getProducts(nextPage, PAGE_SIZE, currentSearch);

      // Ignore a page fetched for a previous search.
      if (currentSearch !== search.trim()) return;

      setProducts((current) => {
        const existingIds = new Set(current.map((product) => product.id));

        const newProducts = response.content.filter(
          (product) => product.active && !existingIds.has(product.id),
        );

        return [...current, ...newProducts];
      });

      setPage(response.page.number);
      setHasMore(response.page.number + 1 < response.page.totalPages);
    } catch (error) {
      console.error("Failed to load more products:", error);

      Alert.alert("Erro", "Não foi possível carregar mais produtos.");
    } finally {
      setLoadingMore(false);
    }
  }

  // Load categories only when creating a new product
  useEffect(() => {
    if (!visible || productMode !== "new") return;

    let active = true;

    async function loadCategories() {
      try {
        setLoadingCategories(true);
        setCategoriesError(null);

        const response = await getCategories();

        if (active) {
          setCategories(response);
        }
      } catch (error) {
        console.error("Failed to load categories:", error);

        if (active) {
          setCategoriesError("Não foi possível carregar as categorias.");
        }
      } finally {
        if (active) {
          setLoadingCategories(false);
        }
      }
    }

    void loadCategories();

    return () => {
      active = false;
    };
  }, [visible, productMode, categoryReload]);

  function closeModal() {
    if (saving) return;

    onClose();
  }

  function changeMode(mode: ProductMode) {
    if (saving) return;

    setProductMode(mode);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setSelectedProduct(null);
  }

  async function handleAddProduct() {
    if (saving) return;

    const parsedQuantity = Number(quantity.trim().replace(",", "."));

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert("Atenção", "Introduz uma quantidade válida.");
      return;
    }

    if (productMode === "existing") {
      if (!selectedProduct) {
        Alert.alert("Atenção", "Selecciona um produto.");
        return;
      }
    }

    if (productMode === "new") {
      if (!newProductName.trim()) {
        Alert.alert("Atenção", "Introduz o nome do produto.");
        return;
      }

      if (selectedCategoryId === null) {
        Alert.alert("Atenção", "Selecciona uma categoria.");
        return;
      }
    }

    try {
      setSaving(true);

      if (productMode === "existing") {
        await addShoppingItem(listId, {
          productId: selectedProduct!.id,
          quantity: parsedQuantity,
          unit: selectedUnit,
        });
      } else {
        await addShoppingItem(listId, {
          product: {
            name: newProductName.trim(),
            categoryId: selectedCategoryId!,
          },
          quantity: parsedQuantity,
          unit: selectedUnit,
        });
      }

      onClose();
      onAdded();
    } catch (error) {
      if (error instanceof ShoppingItemConflictError) {
        const productName =
          productMode === "existing"
            ? selectedProduct?.name
            : newProductName.trim();

        Alert.alert(
          "Produto já adicionado",
          `${productName || "Este produto"} já existe na tua lista de compras.`,
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

  function renderExistingProducts() {
    return (
      <>
        <Text style={styles.label}>Pesquisar produto</Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />

          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar produto..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={handleSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!saving}
          />

          {search.length > 0 && (
            <Pressable
              onPress={() => handleSearchChange("")}
              disabled={saving}
              accessibilityLabel="Limpar pesquisa"
            >
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </Pressable>
          )}
        </View>

        <View style={styles.productsContainer}>
          {loadingProducts || searchPending ? (
            <View style={styles.center}>
              <ActivityIndicator color={COLORS.primary} />

              <Text style={styles.hint}>A pesquisar produtos...</Text>
            </View>
          ) : productsError ? (
            <View style={styles.center}>
              <Text style={styles.hint}>{productsError}</Text>

              <Pressable
                onPress={() => setProductReload((current) => current + 1)}
              >
                <Text style={styles.linkText}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {products.length === 0 ? (
                <View style={styles.center}>
                  <Text style={styles.hint}>Nenhum produto encontrado.</Text>

                  <Pressable
                    onPress={() => changeMode("new")}
                    style={styles.createNewLink}
                  >
                    <Text style={styles.linkText}>+ Criar novo produto</Text>
                  </Pressable>
                </View>
              ) : (
                products.map((product) => {
                  const selected = selectedProduct?.id === product.id;

                  return (
                    <Pressable
                      key={product.id}
                      style={[
                        styles.productRow,
                        selected && styles.selectedRow,
                      ]}
                      onPress={() => setSelectedProduct(product)}
                      disabled={saving}
                      accessibilityRole="radio"
                      accessibilityState={{
                        selected,
                      }}
                    >
                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>{product.name}</Text>

                        <Text style={styles.categoryName}>
                          {product.category.name}
                        </Text>
                      </View>

                      <Ionicons
                        name={selected ? "checkmark-circle" : "ellipse-outline"}
                        size={24}
                        color={selected ? COLORS.primary : "#9CA3AF"}
                      />
                    </Pressable>
                  );
                })
              )}

              {hasMore && (
                <Pressable
                  style={styles.loadMoreButton}
                  onPress={() => void loadMoreProducts()}
                  disabled={loadingMore || saving}
                >
                  {loadingMore ? (
                    <ActivityIndicator color={COLORS.primary} />
                  ) : (
                    <Text style={styles.linkText}>Carregar mais produtos</Text>
                  )}
                </Pressable>
              )}
            </>
          )}
        </View>
      </>
    );
  }

  function renderNewProduct() {
    return (
      <>
        <Text style={styles.label}>Nome do produto</Text>

        <TextInput
          style={styles.textInput}
          placeholder="Ex.: Arroz"
          placeholderTextColor="#9CA3AF"
          value={newProductName}
          onChangeText={setNewProductName}
          editable={!saving}
          maxLength={100}
          autoCapitalize="sentences"
        />

        <Text style={styles.label}>Categoria</Text>

        <View style={styles.categoriesContainer}>
          {loadingCategories ? (
            <View style={styles.center}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.hint}>A carregar categorias...</Text>
            </View>
          ) : categoriesError ? (
            <View style={styles.center}>
              <Text style={styles.hint}>{categoriesError}</Text>

              <Pressable
                onPress={() => setCategoryReload((current) => current + 1)}
              >
                <Text style={styles.linkText}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : categories.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.hint}>
                Não existem categorias disponíveis.
              </Text>
            </View>
          ) : (
            categories.map((category) => {
              const selected = selectedCategoryId === category.id;

              return (
                <Pressable
                  key={category.id}
                  style={[styles.productRow, selected && styles.selectedRow]}
                  onPress={() => setSelectedCategoryId(category.id)}
                  disabled={saving}
                  accessibilityRole="radio"
                  accessibilityState={{
                    selected,
                  }}
                >
                  <Text style={styles.productName}>{category.name}</Text>

                  <Ionicons
                    name={selected ? "checkmark-circle" : "ellipse-outline"}
                    size={23}
                    color={selected ? COLORS.primary : "#9CA3AF"}
                  />
                </Pressable>
              );
            })
          )}
        </View>
      </>
    );
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

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {/* Choose product mode */}
            <View style={styles.modeRow}>
              <Pressable
                style={[
                  styles.modeButton,
                  productMode === "existing" && styles.activeMode,
                ]}
                onPress={() => changeMode("existing")}
                disabled={saving}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    productMode === "existing" && styles.activeModeText,
                  ]}
                >
                  Existente
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modeButton,
                  productMode === "new" && styles.activeMode,
                ]}
                onPress={() => changeMode("new")}
                disabled={saving}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    productMode === "new" && styles.activeModeText,
                  ]}
                >
                  Novo produto
                </Text>
              </Pressable>
            </View>

            {/* Product selection */}
            {productMode === "existing"
              ? renderExistingProducts()
              : renderNewProduct()}

            {/* Quantity */}
            <Text style={styles.label}>Quantidade</Text>

            <TextInput
              style={styles.textInput}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
              editable={!saving}
              selectTextOnFocus
              accessibilityLabel="Quantidade"
            />

            {/* Unit */}
            <Text style={styles.label}>Unidade</Text>

            <View style={styles.unitOptions}>
              {UNITS.map((unit) => {
                const selected = selectedUnit === unit.value;

                return (
                  <Pressable
                    key={unit.value}
                    style={[
                      styles.unitOption,
                      selected && styles.selectedUnitOption,
                    ]}
                    onPress={() => setSelectedUnit(unit.value)}
                    disabled={saving}
                  >
                    <Text
                      style={[
                        styles.unitOptionText,
                        selected && styles.selectedUnitText,
                      ]}
                    >
                      {unit.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Submit */}
            <Pressable
              style={[styles.addButton, saving && styles.disabledButton]}
              onPress={() => void handleAddProduct()}
              disabled={
                saving ||
                (productMode === "existing" &&
                  (loadingProducts || searchPending || !!productsError)) ||
                (productMode === "new" &&
                  (loadingCategories || !!categoriesError))
              }
              accessibilityRole="button"
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
          </ScrollView>
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
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 24,
    maxHeight: "88%",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  title: {
    fontSize: 21,
    fontWeight: "700",
    color: "#111827",
  },

  scrollView: {
    flexShrink: 1,
  },

  scrollContent: {
    paddingBottom: 18,
  },

  modeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },

  modeButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "transparent",
  },

  activeMode: {
    backgroundColor: "#E9F8F1",
    borderColor: COLORS.primary,
  },

  modeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },

  activeModeText: {
    color: COLORS.primary,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
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

  productsContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 24,
  },

  categoriesContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 24,
  },

  center: {
    padding: 22,
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
    flex: 1,
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

  linkText: {
    color: COLORS.primary,
    fontWeight: "600",
  },

  createNewLink: {
    marginTop: 6,
    paddingVertical: 8,
  },

  loadMoreButton: {
    padding: 14,
    alignItems: "center",
  },

  textInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: "#111827",
    marginBottom: 22,
  },

  unitOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },

  unitOption: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  selectedUnitOption: {
    backgroundColor: "#E9F8F1",
    borderColor: COLORS.primary,
  },

  unitOptionText: {
    fontSize: 13,
    color: "#374151",
  },

  selectedUnitText: {
    color: COLORS.primary,
    fontWeight: "600",
  },

  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 52,
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
    marginTop: 4,
  },

  cancelText: {
    fontSize: 15,
    color: "#6B7280",
  },
});
