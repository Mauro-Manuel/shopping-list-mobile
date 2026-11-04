
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

import { updateShoppingItem } from "../../services/shopping-item.service";
import type { ShoppingListItem } from "../../types/shopping-list";
import { UNITS, type Unit } from "../../types/unit";
import { COLORS } from "../../theme/colors";

type Props = {
  visible: boolean;
  listId: number;
  item: ShoppingListItem | null;
  onClose: () => void;
  onUpdated: () => void;
};

export default function EditShoppingItemModal({
  visible,
  listId,
  item,
  onClose,
  onUpdated,
}: Props) {
  const [quantity, setQuantity] = useState("1");
  const [selectedUnit, setSelectedUnit] = useState<Unit>("UNIT");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !item) return;

    setQuantity(String(item.quantity));
    setSelectedUnit(item.unit as Unit);
  }, [visible, item]);

  function closeModal() {
    if (saving) return;
    onClose();
  }

  async function handleSave() {
    if (!item || saving) return;

    const parsedQuantity = Number(quantity.trim().replace(",", "."));

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert("Atenção", "Introduz uma quantidade válida.");
      return;
    }

    try {
      setSaving(true);

      await updateShoppingItem(listId, item.id, {
        quantity: parsedQuantity,
        unit: selectedUnit,
      });

      onClose();
      onUpdated();
    } catch (error) {
      console.error("Failed to update shopping item:", error);

      Alert.alert(
        "Erro",
        "Não foi possível actualizar o produto. Tenta novamente.",
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
            <Text style={styles.title}>Editar Produto</Text>

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
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.productCard}>
              <Text style={styles.productName}>
                {item?.product.name}
              </Text>

              <Text style={styles.categoryName}>
                {item?.category.name}
              </Text>
            </View>

            <Text style={styles.label}>Quantidade</Text>

            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
              selectTextOnFocus
              editable={!saving}
              accessibilityLabel="Quantidade"
            />

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
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
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

            <Pressable
              style={[
                styles.saveButton,
                saving && styles.disabledButton,
              ]}
              onPress={() => void handleSave()}
              disabled={saving || !item}
              accessibilityRole="button"
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>
                  Guardar Alterações
                </Text>
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
    paddingBottom: 32,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  title: {
    fontSize: 21,
    fontWeight: "700",
    color: "#111827",
  },
  productCard: {
    backgroundColor: "#F8FAF9",
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  productName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  categoryName: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  input: {
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
    marginBottom: 26,
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
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    alignItems: "center",
    padding: 16,
  },
  cancelText: {
    color: "#6B7280",
    fontSize: 15,
  },
});
