import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import AppTextInput from "../../components/ui/AppTextInput";
import AppButton from "../../components/ui/AppButton";

import { COLORS } from "../../theme/colors";
import { authStyles as styles } from "../../styles/auth.styles";

import {
  isRequired,
  isValidEmail,
  passwordsMatch,
} from "../../utils/validation";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function handleRegister() {
    if (
      !isRequired(name) ||
      !isRequired(email) ||
      !isRequired(password) ||
      !isRequired(confirmPassword)
    ) {
      Alert.alert("Atenção", "Preencha todos os campos obrigatórios.");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert("Atenção", "Introduza um e-mail válido.");
      return;
    }

    if (!passwordsMatch(password, confirmPassword)) {
      Alert.alert("Atenção", "As palavras-passe não coincidem.");
      return;
    }

    Alert.alert(
      "Criar conta",
      "Formulário validado! O registo será integrado com a API na próxima etapa.",
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.brand, styles.registerBrand]}>
          <Ionicons
            name="person-add-outline"
            size={48}
            color={COLORS.primary}
          />

          <Text style={styles.title}>Criar conta</Text>

          <Text style={styles.subtitle}>
            Crie a sua conta e comece a organizar as suas compras.
          </Text>
        </View>

        <View style={styles.form}>
          <AppTextInput
            label="Nome"
            icon="person-outline"
            placeholder="Digite seu nome"
            autoCapitalize="words"
            autoComplete="name"
            value={name}
            onChangeText={setName}
          />

          <AppTextInput
            label="E-mail"
            icon="mail-outline"
            placeholder="Digite seu e-mail"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />

          <AppTextInput
            label="Palavra-passe"
            icon="lock-closed-outline"
            placeholder="Crie uma palavra-passe"
            autoComplete="new-password"
            isPassword
            value={password}
            onChangeText={setPassword}
          />

          <AppTextInput
            label="Confirmar palavra-passe"
            icon="shield-checkmark-outline"
            placeholder="Confirme sua palavra-passe"
            autoComplete="new-password"
            isPassword
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <AppButton title="Criar conta" onPress={handleRegister} />

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Já tem uma conta?</Text>

            <Pressable
              onPress={() => router.replace("/login")}
              accessibilityRole="link"
            >
              <Text style={styles.registerLink}>Entrar</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
