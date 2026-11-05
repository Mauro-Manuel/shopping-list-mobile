import { useEffect, useRef, useState } from "react";
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
import {
  getCategories,
  createCategory,
  deleteCategory,
  updateCategory,
} from "../../services/category.service";
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

const CATEGORY_ICONS = [
  "🛒",
  "🍎",
  "🥤",
  "🥩",
  "🥦",
  "🍞",
  "🧹",
  "🧴",
  "💊",
  "👶",
  "🐶",
  "🏠",
  "👕",
  "📦",
];

export default function AddShoppingItemModal({
  visible,
  listId,
  onClose,
  onAdded,
}: Props) {
  const [productMode, setProductMode] = useState<ProductMode>("existing");

  // Produtos existentes
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

  // Novo produto
  const [newProductName, setNewProductName] = useState("");

  // Categorias
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null,
  );

  const [updatingCategory, setUpdatingCategory] = useState(false);

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoryReload, setCategoryReload] = useState(0);

  // Selector de categorias
  const [categorySelectOpen, setCategorySelectOpen] = useState(false);

  // Nova categoria
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("🛒");
  const [savingCategory, setSavingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(
    null,
  );

  // Campos partilhados
  const [quantity, setQuantity] = useState("1");
  const [selectedUnit, setSelectedUnit] = useState<Unit>("UNIT");
  const [saving, setSaving] = useState(false);

  const loadingMoreRef = useRef(false);

  const busy =
    saving || savingCategory || updatingCategory || deletingCategoryId !== null;

  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId) ?? null;

  // Reiniciar formulário
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

    setCategorySelectOpen(false);
    setShowCreateCategory(false);
    setNewCategoryName("");
    setNewCategoryIcon("🛒");

    setQuantity("1");
    setSelectedUnit("UNIT");
    setEditingCategoryId(null);
    setUpdatingCategory(false);
  }, [visible]);

  // Debounce da pesquisa
  useEffect(() => {
    if (!visible) return;

    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(timeout);
  }, [visible, search]);

  const searchPending = search.trim() !== debouncedSearch;

  // Carregar produtos existentes
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

  // Paginação dos produtos
  async function loadMoreProducts() {
    if (
      loadingProducts ||
      loadingMoreRef.current ||
      !hasMore ||
      searchPending ||
      busy
    ) {
      return;
    }

    loadingMoreRef.current = true;

    const nextPage = page + 1;
    const currentSearch = debouncedSearch;

    try {
      setLoadingMore(true);

      const response = await getProducts(nextPage, PAGE_SIZE, currentSearch);

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
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }

  // Carregar categorias
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
    if (busy) return;

    onClose();
  }

  function changeMode(mode: ProductMode) {
    if (busy) return;

    setProductMode(mode);
    setCategorySelectOpen(false);
    setShowCreateCategory(false);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setSelectedProduct(null);
  }

  // Seleccionar categoria
  function handleSelectCategory(category: Category) {
    if (busy) return;

    setSelectedCategoryId(category.id);
    setCategorySelectOpen(false);
    setShowCreateCategory(false);
  }

  // Abrir formulário de categoria
  function handleOpenCreateCategory() {
    if (busy) return;

    setEditingCategoryId(null);
    setNewCategoryName("");
    setNewCategoryIcon("🛒");

    setCategorySelectOpen(false);
    setShowCreateCategory(true);
  }

  function handleEditCategory(category: Category) {
    if (busy || category.type !== "CUSTOM") {
      return;
    }

    setEditingCategoryId(category.id);
    setNewCategoryName(category.name);
    setNewCategoryIcon(category.icon || "🛒");

    setCategorySelectOpen(false);
    setShowCreateCategory(true);
  }

  function handleCancelCategoryForm() {
    if (busy) return;

    setShowCreateCategory(false);
    setEditingCategoryId(null);
    setNewCategoryName("");
    setNewCategoryIcon("🛒");
  }

  // Criar categoria personalizada
  async function handleCreateCategory() {
    if (busy) return;

    const name = newCategoryName.trim();

    if (!name) {
      Alert.alert("Atenção", "Introduz o nome da categoria.");
      return;
    }

    if (!newCategoryIcon.trim()) {
      Alert.alert("Atenção", "Selecciona um ícone para a categoria.");
      return;
    }

    try {
      setSavingCategory(true);

      const createdCategory = await createCategory({
        name,
        icon: newCategoryIcon,
      });

      setCategories((current) => {
        const withoutDuplicate = current.filter(
          (category) => category.id !== createdCategory.id,
        );

        return [...withoutDuplicate, createdCategory].sort((a, b) =>
          a.name.localeCompare(b.name),
        );
      });

      setSelectedCategoryId(createdCategory.id);

      setNewCategoryName("");
      setNewCategoryIcon("🛒");
      setShowCreateCategory(false);
      setCategorySelectOpen(false);

      Alert.alert(
        "Categoria criada",
        "A nova categoria foi criada e seleccionada.",
      );
    } catch (error) {
      console.error("Failed to create category:", error);

      if (
        error instanceof Error &&
        error.message === "Category already exists"
      ) {
        Alert.alert(
          "Categoria existente",
          "Já existe uma categoria com este nome.",
        );
        return;
      }

      Alert.alert(
        "Erro",
        "Não foi possível criar a categoria. Tenta novamente.",
      );
    } finally {
      setSavingCategory(false);
    }
  }

  // Adicionar produto à lista
  async function handleAddProduct() {
    if (busy) return;

    const parsedQuantity = Number(quantity.trim().replace(",", "."));

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert("Atenção", "Introduz uma quantidade válida.");
      return;
    }

    if (productMode === "existing" && !selectedProduct) {
      Alert.alert("Atenção", "Selecciona um produto.");
      return;
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

  function handleDeleteCategory(category: Category) {
    if (busy || category.type !== "CUSTOM") {
      return;
    }

    Alert.alert(
      "Eliminar Categoria",
      `Queres eliminar a categoria "${category.name}"?\n\n` +
        "Os produtos associados serão transferidos automaticamente " +
        'para a categoria "Outros". Nenhum produto será eliminado.',
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            void confirmDeleteCategory(category.id);
          },
        },
      ],
    );
  }

  async function confirmDeleteCategory(categoryId: number) {
    if (busy) return;

    try {
      setDeletingCategoryId(categoryId);

      await deleteCategory(categoryId);

      // Actualizar categorias após eliminar.
      const updatedCategories = await getCategories();

      setCategories(updatedCategories);

      // Limpar a selecção, caso a categoria
      // eliminada estivesse seleccionada.
      setSelectedCategoryId((current) =>
        current === categoryId ? null : current,
      );

      Alert.alert(
        "Categoria eliminada",
        'A categoria foi eliminada. Os produtos associados passaram para "Outros".',
      );
    } catch (error) {
      console.error("Failed to delete category:", error);

      // Recarregar categorias mesmo que a actualização
      // posterior tenha falhado.
      setCategoryReload((current) => current + 1);

      Alert.alert(
        "Erro",
        "Não foi possível confirmar a eliminação da categoria. " +
          "Verifica a lista e tenta novamente, se necessário.",
      );
    } finally {
      setDeletingCategoryId(null);
    }
  }

  async function handleUpdateCategory() {
    if (busy || editingCategoryId === null) {
      return;
    }

    const name = newCategoryName.trim();
    const icon = newCategoryIcon.trim();
    const categoryId = editingCategoryId;

    if (!name) {
      Alert.alert("Atenção", "Introduz o nome da categoria.");
      return;
    }

    if (!icon) {
      Alert.alert("Atenção", "Selecciona um ícone.");
      return;
    }

    try {
      setUpdatingCategory(true);

      await updateCategory(categoryId, {
        name,
        icon,
      });

      // A API é a fonte de verdade.
      // Recarregar garante os dados actualizados.
      const updatedCategories = await getCategories();

      setCategories(updatedCategories);

      setShowCreateCategory(false);
      setEditingCategoryId(null);
      setNewCategoryName("");
      setNewCategoryIcon("🛒");

      Alert.alert(
        "Categoria actualizada",
        "As alterações foram guardadas com sucesso.",
      );
    } catch (error) {
      console.error("Failed to update category:", error);

      if (
        error instanceof Error &&
        error.message === "Category already exists"
      ) {
        Alert.alert(
          "Categoria existente",
          "Já existe uma categoria com este nome.",
        );
        return;
      }

      Alert.alert(
        "Erro",
        "Não foi possível concluir a actualização. " +
          "Verifica os dados da categoria e tenta novamente.",
      );

      // Actualizar a lista, caso o PUT tenha sido
      // concluído mas a consulta seguinte tenha falhado.
      setCategoryReload((current) => current + 1);
    } finally {
      setUpdatingCategory(false);
    }
  }

  // Produtos existentes
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
            editable={!busy}
          />

          {search.length > 0 && (
            <Pressable
              onPress={() => handleSearchChange("")}
              disabled={busy}
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
                      disabled={busy}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
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
                  disabled={loadingMore || busy}
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

  // Select de categorias
  function renderCategorySelect() {
    if (loadingCategories) {
      return (
        <View style={styles.categoryLoading}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.hint}>A carregar categorias...</Text>
        </View>
      );
    }

    if (categoriesError) {
      return (
        <View style={styles.categoryLoading}>
          <Text style={styles.hint}>{categoriesError}</Text>

          <Pressable
            onPress={() => setCategoryReload((current) => current + 1)}
          >
            <Text style={styles.linkText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <>
        <Pressable
          style={[
            styles.selectButton,
            categorySelectOpen && styles.selectButtonOpen,
          ]}
          onPress={() => setCategorySelectOpen((current) => !current)}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Seleccionar categoria"
          accessibilityState={{
            expanded: categorySelectOpen,
          }}
        >
          <View style={styles.selectValue}>
            {selectedCategory?.icon ? (
              <Text style={styles.categoryEmoji}>{selectedCategory.icon}</Text>
            ) : (
              <Ionicons name="grid-outline" size={20} color="#9CA3AF" />
            )}

            <Text
              style={[
                styles.selectText,
                !selectedCategory && styles.selectPlaceholder,
              ]}
              numberOfLines={1}
            >
              {selectedCategory?.name ?? "Selecciona uma categoria"}
            </Text>
          </View>

          <Ionicons
            name={categorySelectOpen ? "chevron-up" : "chevron-down"}
            size={20}
            color="#6B7280"
          />
        </Pressable>

        {categorySelectOpen && (
          <View style={styles.dropdown}>
            <ScrollView
              style={styles.dropdownScroll}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {categories.length === 0 ? (
                <Text style={styles.dropdownEmpty}>
                  Ainda não existem categorias.
                </Text>
              ) : (
                categories.map((category) => {
                  const selected = selectedCategoryId === category.id;
                  const isCustom = category.type === "CUSTOM";
                  const isDeleting = deletingCategoryId === category.id;

                  return (
                    <View
                      key={category.id}
                      style={[
                        styles.dropdownOption,
                        selected && styles.selectedRow,
                      ]}
                    >
                      {/* Seleccionar categoria */}
                      <Pressable
                        style={styles.categorySelectAction}
                        onPress={() => handleSelectCategory(category)}
                        disabled={busy}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                      >
                        <Text style={styles.categoryEmoji}>
                          {category.icon || "📦"}
                        </Text>

                        <Text
                          style={styles.dropdownOptionText}
                          numberOfLines={1}
                        >
                          {category.name}
                        </Text>

                        {selected && (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color={COLORS.primary}
                          />
                        )}
                      </Pressable>

                      {/* Editar: apenas categorias personalizadas */}
                      {isCustom && (
                        <Pressable
                          style={styles.categoryEditButton}
                          onPress={() => handleEditCategory(category)}
                          disabled={busy}
                          accessibilityRole="button"
                          accessibilityLabel={`Editar categoria ${category.name}`}
                        >
                          <Ionicons
                            name="create-outline"
                            size={21}
                            color={COLORS.primary}
                          />
                        </Pressable>
                      )}

                      {/* Eliminar: apenas categorias personalizadas */}
                      {isCustom && (
                        <Pressable
                          style={styles.categoryDeleteButton}
                          onPress={() => handleDeleteCategory(category)}
                          disabled={busy}
                          accessibilityRole="button"
                          accessibilityLabel={`Eliminar categoria ${category.name}`}
                        >
                          {isDeleting ? (
                            <ActivityIndicator size="small" color="#DC2626" />
                          ) : (
                            <Ionicons
                              name="trash-outline"
                              size={21}
                              color="#DC2626"
                            />
                          )}
                        </Pressable>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        )}

        {!showCreateCategory && (
          <Pressable
            style={styles.newCategoryLink}
            onPress={handleOpenCreateCategory}
            disabled={busy}
            accessibilityRole="button"
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={COLORS.primary}
            />

            <Text style={styles.linkText}>Nova Categoria</Text>
          </Pressable>
        )}
      </>
    );
  }

  // Formulário de nova categoria
  function renderCreateCategory() {
    if (!showCreateCategory) return null;

    return (
      <View style={styles.createCategoryCard}>
        <View style={styles.createCategoryHeader}>
          <Text style={styles.createCategoryTitle}>
            {editingCategoryId !== null
              ? "Editar Categoria"
              : "Criar Categoria"}
          </Text>

          <Pressable
            onPress={handleCancelCategoryForm}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Cancelar criação de categoria"
          >
            <Ionicons name="close" size={21} color="#6B7280" />
          </Pressable>
        </View>

        <Text style={styles.label}>Nome da categoria</Text>

        <TextInput
          style={styles.textInput}
          placeholder="Ex.: Bebidas"
          placeholderTextColor="#9CA3AF"
          value={newCategoryName}
          onChangeText={setNewCategoryName}
          maxLength={100}
          autoCapitalize="sentences"
          editable={!busy}
        />

        <Text style={styles.label}>Escolhe um ícone</Text>

        <View style={styles.iconGrid}>
          {CATEGORY_ICONS.map((icon) => {
            const selected = newCategoryIcon === icon;

            return (
              <Pressable
                key={icon}
                style={[
                  styles.iconOption,
                  selected && styles.selectedIconOption,
                ]}
                onPress={() => setNewCategoryIcon(icon)}
                disabled={busy}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Ícone ${icon}`}
              >
                <Text style={styles.iconText}>{icon}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.createCategoryButton, busy && styles.disabledButton]}
          onPress={() => {
            if (editingCategoryId !== null) {
              void handleUpdateCategory();
            } else {
              void handleCreateCategory();
            }
          }}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={
            editingCategoryId !== null
              ? "Guardar alterações da categoria"
              : "Criar categoria"
          }
        >
          {savingCategory || updatingCategory ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name={editingCategoryId !== null ? "save-outline" : "checkmark"}
                size={20}
                color="#FFFFFF"
              />

              <Text style={styles.addButtonText}>
                {editingCategoryId !== null
                  ? "Guardar Alterações"
                  : "Criar Categoria"}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    );
  }

  // Novo produto
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
          editable={!busy}
          maxLength={100}
          autoCapitalize="sentences"
        />

        <Text style={styles.label}>Categoria</Text>

        {renderCategorySelect()}
        {renderCreateCategory()}
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
              disabled={busy}
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
            {/* Modo do produto */}
            <View style={styles.modeRow}>
              <Pressable
                style={[
                  styles.modeButton,
                  productMode === "existing" && styles.activeMode,
                ]}
                onPress={() => changeMode("existing")}
                disabled={busy}
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
                disabled={busy}
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

            {/* Produto */}
            {productMode === "existing"
              ? renderExistingProducts()
              : renderNewProduct()}

            {/* Quantidade */}
            <Text style={styles.label}>Quantidade</Text>

            <TextInput
              style={styles.textInput}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
              editable={!busy}
              selectTextOnFocus
              accessibilityLabel="Quantidade"
            />

            {/* Unidade */}
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
                    disabled={busy}
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

            {/* Guardar produto */}
            <Pressable
              style={[styles.addButton, busy && styles.disabledButton]}
              onPress={() => void handleAddProduct()}
              disabled={
                busy ||
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
              disabled={busy}
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

  categoryLoading: {
    paddingVertical: 20,
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
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

  // Select de categorias
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 52,
  },

  selectButtonOpen: {
    borderColor: COLORS.primary,
  },

  selectValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },

  selectText: {
    fontSize: 15,
    color: "#111827",
    flex: 1,
  },

  selectPlaceholder: {
    color: "#9CA3AF",
  },

  categoryEmoji: {
    fontSize: 21,
  },

  dropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },

  dropdownScroll: {
    maxHeight: 220,
  },

  dropdownOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  dropdownOptionText: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },

  dropdownEmpty: {
    padding: 18,
    textAlign: "center",
    color: "#6B7280",
  },

  newCategoryLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 14,
    marginBottom: 16,
  },

  // Nova categoria
  createCategoryCard: {
    backgroundColor: "#F8FAF9",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },

  createCategoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  createCategoryTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },

  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 22,
  },

  iconOption: {
    width: 47,
    height: 47,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  selectedIconOption: {
    borderColor: COLORS.primary,
    backgroundColor: "#E9F8F1",
    borderWidth: 2,
  },

  iconText: {
    fontSize: 24,
  },

  createCategoryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    minHeight: 48,
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
  categorySelectAction: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
  },

  categoryDeleteButton: {
    width: 42,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  categoryEditButton: {
    width: 42,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
});
