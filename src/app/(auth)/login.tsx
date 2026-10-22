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

import { useAuth } from "../../contexts/AuthProvider";

import { isRequired, isValidEmail } from "../../utils/validation";

import { COLORS } from "../../theme/colors";
import { authStyles as styles } from "../../styles/auth.styles";

import AppTextInput from "../../components/ui/AppTextInput";
import AppButton from "../../components/ui/AppButton";

export default function LoginScreen() {
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (loading) return;

    if (!isRequired(email) || !isRequired(password)) {
      Alert.alert("Atenção", "Preencha o e-mail e a palavra-passe.");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert("Atenção", "Introduza um e-mail válido.");
      return;
    }

    try {
      setLoading(true);

      await signIn({
        email: email.trim(),
        password,
      });

      router.replace("/(tabs)");

      Alert.alert("Autenticação", "Login efectuado com sucesso!");
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case "Invalid email or password":
            Alert.alert(
              "Erro de autenticação",
              "E-mail ou palavra-passe incorrectos.",
            );
            break;

          case "Too many login attempts. Please try again later.":
            Alert.alert(
              "Limite excedido",
              "Demasiadas tentativas. Tente novamente mais tarde.",
            );
            break;

          default:
            Alert.alert(
              "Erro",
              "Não foi possível iniciar sessão. Tente novamente.",
            );
        }
      } else {
        Alert.alert("Erro", "Ocorreu um erro inesperado.");
      }
    } finally {
      setLoading(false);
    }
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
        <View style={styles.brand}>
          <Ionicons name="cart" size={72} color={COLORS.primary} />

          <Text style={styles.title}>Lista de Compras</Text>

          <Text style={styles.subtitle}>
            Organize suas compras de forma simples e prática
          </Text>
        </View>

        <View style={styles.form}>
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
            placeholder="Digite sua palavra-passe"
            autoComplete="password"
            isPassword
            value={password}
            onChangeText={setPassword}
          />

          <AppButton title="Entrar" onPress={handleLogin} loading={loading} />

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Ainda não tem uma conta?</Text>

            <Pressable
              onPress={() => router.push("/register")}
              accessibilityRole="link"
            >
              <Text style={styles.registerLink}>Criar conta</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
