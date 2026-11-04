import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

import { renameShoppingList } from "../../services/shopping-list.service";
import { COLORS } from "../../theme/colors";

type Props = {
  visible: boolean;
  listId: number;
  currentName: string;
  onClose: () => void;
  onRenamed: () => void;
};

export default function RenameShoppingListModal({
  visible,
  listId,
  currentName,
  onClose,
  onRenamed,
}: Props) {
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(currentName);
    }
  }, [visible, currentName]);

  function closeModal() {
    if (saving) return;
    onClose();
  }

  async function handleSave() {
    if (saving) return;

    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert("Atenção", "Introduz o nome da lista.");
      return;
    }

    if (trimmedName === currentName) {
      onClose();
      return;
    }

    try {
      setSaving(true);

      await renameShoppingList(listId, trimmedName);

      onClose();
      onRenamed();
    } catch (error) {
      console.error("Failed to rename shopping list:", error);

      Alert.alert(
        "Erro",
        "Não foi possível alterar o nome da lista. Tenta novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={closeModal}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Renomear Lista</Text>

            <Pressable
              onPress={closeModal}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          <Text style={styles.label}>Nome da lista</Text>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex.: Compras de Novembro"
            placeholderTextColor="#9CA3AF"
            autoFocus
            maxLength={100}
            editable={!saving}
            returnKeyType="done"
            onSubmitEditing={() => void handleSave()}
            selectTextOnFocus
          />

          <Pressable
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={() => void handleSave()}
            disabled={saving}
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Alterações</Text>
            )}
          </Pressable>

          <Pressable
            onPress={closeModal}
            disabled={saving}
            style={styles.cancelButton}
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
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
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
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
    marginBottom: 22,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
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
    padding: 14,
    marginTop: 4,
  },
  cancelText: {
    fontSize: 15,
    color: "#6B7280",
  },
});
