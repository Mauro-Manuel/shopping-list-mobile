import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { logout, loginAndSaveSession } from "../services/auth.session";
import {
  createAuthSessionInitializer,
  getInitialAuthStatus,
  resolveAuthStatus,
  type AuthContextStatus,
} from "./auth.context";

type LoginCredentials = {
  email: string;
  password: string;
};

type AuthContextValue = {
  status: AuthContextStatus;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  retry: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthContextStatus>(getInitialAuthStatus);

  const [initialize] = useState(createAuthSessionInitializer);

  useEffect(() => {
    let active = true;

    initialize().then((result) => {
      if (active) {
        setStatus(result);
      }
    });

    return () => {
      active = false;
    };
  }, [initialize]);

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    await loginAndSaveSession(credentials);
    setStatus("authenticated");
  }, []);

  const signOut = useCallback(async () => {
    await logout();
    setStatus("unauthenticated");
  }, []);

  const retry = useCallback(async () => {
    setStatus(null);

    const result = await resolveAuthStatus();
    setStatus(result);
  }, []);

  const value = useMemo(
    () => ({
      status,
      signIn,
      signOut,
      retry,
    }),
    [status, signIn, signOut, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
