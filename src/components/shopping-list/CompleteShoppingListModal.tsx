import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { completeShoppingList } from "../../services/shopping-list.service";
import type { ShoppingListDetails } from "../../types/shopping-list";
import { getUnitLabel } from "../../types/unit";
import { COLORS } from "../../theme/colors";

type Props = {
  visible: boolean;
  list: ShoppingListDetails;
  onClose: () => void;
  onCompleted: () => void;
};

export default function CompleteShoppingListModal({
  visible,
  list,
  onClose,
  onCompleted,
}: Props) {
  const [completing, setCompleting] = useState(false);

  const [completed, setCompleted] = useState(false);

  const showCelebration = completed || list.status === "COMPLETED";

  useEffect(() => {
    if (!visible) {
      setCompleted(false);
    }
  }, [visible]);

  const pendingItems = list.items.filter((item) => !item.checked);

  const progress = Math.min(100, Math.max(0, list.progress));

  const allPurchased = list.totalItems > 0 && pendingItems.length === 0;

  function handleClose() {
    if (completing) return;
    onClose();
  }

  async function handleComplete() {
    if (completing || completed || list.status !== "ACTIVE") {
      return;
    }

    try {
      setCompleting(true);

      await completeShoppingList(list.id);

      // Mostra a celebração apenas após sucesso da API.
      setCompleted(true);

      // Actualiza os detalhes da lista no ecrã principal.
      onCompleted();
    } catch (error) {
      console.error("Failed to complete shopping list:", error);

      Alert.alert(
        "Não foi possível concluir",
        "Não conseguimos concluir a lista. Tenta novamente.",
      );
    } finally {
      setCompleting(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.overlay}>
        <View style={styles.content}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Pressable
              style={styles.closeButton}
              onPress={handleClose}
              disabled={completing}
              accessibilityRole="button"
              accessibilityLabel="Fechar resumo"
            >
              <Ionicons name="close" size={25} color="#6B7280" />
            </Pressable>

            <View style={styles.hero}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name="bag-handle-outline"
                  size={72}
                  color={COLORS.primary}
                />

                <View style={styles.checkIcon}>
                  <Ionicons name="checkmark" size={23} color="#FFFFFF" />
                </View>
              </View>

              <Text style={styles.title}>
                {showCelebration ? "Compra concluída! 🎉" : "Resumo da compra"}
              </Text>

              {showCelebration && (
                <Text style={styles.celebrationMessage}>
                  Parabéns! Finalizaste esta compra.
                </Text>
              )}

              <Text style={styles.listName}>{list.name}</Text>

              <Text style={styles.subtitle}>
                {list.checkedItems} de {list.totalItems} produtos comprados
              </Text>
            </View>

            <View style={styles.progressRow}>
              <View style={styles.progressBackground}>
                <View
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>

              <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>

            {pendingItems.length > 0 ? (
              <View style={styles.pendingCard}>
                <View style={styles.pendingHeader}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={20}
                    color="#DC2626"
                  />

                  <Text style={styles.pendingTitle}>
                    {pendingItems.length}{" "}
                    {pendingItems.length === 1
                      ? "produto não comprado"
                      : "produtos não comprados"}
                  </Text>
                </View>

                {pendingItems.map((item) => (
                  <View key={item.id} style={styles.pendingItem}>
                    <View style={styles.bullet} />

                    <View style={styles.pendingItemText}>
                      <Text style={styles.pendingName}>
                        {item.product.name}
                      </Text>

                      <Text style={styles.pendingDetails}>
                        {item.quantity} {getUnitLabel(item.unit)}
                      </Text>
                    </View>
                  </View>
                ))}

                <Text style={styles.pendingNote}>
                  Estes produtos continuarão identificados como não comprados.
                </Text>
              </View>
            ) : allPurchased ? (
              <View style={styles.successCard}>
                <Ionicons
                  name="checkmark-circle"
                  size={23}
                  color={COLORS.primary}
                />

                <Text style={styles.successText}>
                  Todos os produtos foram comprados!
                </Text>
              </View>
            ) : (
              <View style={styles.neutralCard}>
                <Text style={styles.neutralText}>
                  Esta lista ainda não contém produtos.
                </Text>
              </View>
            )}

            <Pressable
              style={styles.secondaryButton}
              onPress={handleClose}
              disabled={completing}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>
                {showCelebration ? "Voltar aos detalhes" : "Ver lista completa"}
              </Text>
            </Pressable>

            {!showCelebration && (
              <Pressable
                style={[
                  styles.completeButton,
                  completing && styles.disabledButton,
                ]}
                onPress={() => void handleComplete()}
                disabled={completing}
                accessibilityRole="button"
              >
                {completing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-done-outline"
                      size={22}
                      color="#FFFFFF"
                    />

                    <Text style={styles.completeButtonText}>
                      Concluir Compra
                    </Text>
                  </>
                )}
              </Pressable>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
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
    maxHeight: "92%",
    paddingHorizontal: 22,
    paddingTop: 16,
  },

  scrollContent: {
    paddingBottom: 24,
  },

  closeButton: {
    alignSelf: "flex-end",
    padding: 8,
  },

  hero: {
    alignItems: "center",
    marginTop: 6,
    marginBottom: 26,
  },

  iconContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#E9F8F1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  checkIcon: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },

  listName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: 8,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
  },

  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },

  progressBackground: {
    flex: 1,
    height: 10,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },

  progressText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },

  pendingCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },

  pendingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },

  pendingTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#B91C1C",
    flex: 1,
  },

  pendingItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },

  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#B91C1C",
    marginTop: 7,
  },

  pendingItemText: {
    flex: 1,
  },

  pendingName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },

  pendingDetails: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 3,
  },

  pendingNote: {
    color: "#B91C1C",
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },

  successCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E9F8F1",
    padding: 16,
    borderRadius: 14,
    gap: 10,
    marginBottom: 20,
  },

  successText: {
    color: COLORS.primary,
    fontWeight: "600",
    flex: 1,
  },

  neutralCard: {
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },

  neutralText: {
    color: "#6B7280",
    textAlign: "center",
  },

  secondaryButton: {
    backgroundColor: "#F1F5F3",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },

  secondaryButtonText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 15,
  },

  completeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  completeButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },

  disabledButton: {
    opacity: 0.6,
  },

  celebrationMessage: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 10,
  },
});
