import { api } from "@/convex/_generated/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";

interface User {
  _id: string;
  email: string;
  name: string;
  phone: string;
  image: string;
  class: string;
  admin?: boolean;
  memohackStudent?: boolean;
  createdAt: number;
  updatedAt: number;
}

// ---------------------------------------------------------------------------
// TokenContext — lightweight, lives OUTSIDE ConvexProviderWithAuth so it can
// supply the JWT to fetchAccessToken without a circular dependency.
// Also persists user data so sessions survive app restarts without needing
// Convex JWKS verification.
// ---------------------------------------------------------------------------

interface TokenContextType {
  rawToken: string | null;
  setRawToken: (token: string | null) => Promise<void>;
  hasCheckedStorage: boolean;
  persistedUser: User | null;
  setPersistedUser: (user: User | null) => Promise<void>;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [rawToken, setRawTokenState] = useState<string | null>(null);
  const [persistedUser, setPersistedUserState] = useState<User | null>(null);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem("auth_token"),
      AsyncStorage.getItem("auth_user"),
    ])
      .then(([storedToken, storedUser]) => {
        if (storedToken) setRawTokenState(storedToken);
        if (storedUser) {
          try {
            setPersistedUserState(JSON.parse(storedUser));
          } catch {
            // ignore malformed cache
          }
        }
      })
      .catch(console.error)
      .finally(() => setHasCheckedStorage(true));
  }, []);

  const setRawToken = async (token: string | null) => {
    setRawTokenState(token);
    if (token) {
      await AsyncStorage.setItem("auth_token", token);
    } else {
      await AsyncStorage.removeItem("auth_token");
      await AsyncStorage.removeItem("auth_user");
      setPersistedUserState(null);
    }
  };

  const setPersistedUser = async (user: User | null) => {
    setPersistedUserState(user);
    if (user) {
      await AsyncStorage.setItem("auth_user", JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem("auth_user");
    }
  };

  return (
    <TokenContext.Provider
      value={{
        rawToken,
        setRawToken,
        hasCheckedStorage,
        persistedUser,
        setPersistedUser,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
}

function useToken() {
  const ctx = useContext(TokenContext);
  if (!ctx) throw new Error("useToken must be used within AppProvider");
  return ctx;
}

/**
 * Used by ConvexProviderWithAuth to inject the JWT into the Convex auth header.
 * The token is read from TokenContext — it is NEVER passed as a function arg,
 * so it will not appear in Convex dashboard logs (fixes C-2).
 */
export function useAuthForConvex() {
  const { rawToken, hasCheckedStorage } = useToken();
  const tokenRef = useRef(rawToken);
  tokenRef.current = rawToken;

  const fetchAccessToken = useCallback(async () => {
    return tokenRef.current;
  }, []);

  return {
    isLoading: !hasCheckedStorage,
    isAuthenticated: rawToken !== null,
    fetchAccessToken,
  };
}

// ---------------------------------------------------------------------------
// AppContext — lives INSIDE ConvexProviderWithAuth, uses Convex hooks.
// ---------------------------------------------------------------------------

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  signin: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    name: string,
    phone: string,
    className: string,
    image?: string,
    memohackStudent?: boolean,
  ) => Promise<void>;
  signout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const {
    rawToken,
    setRawToken,
    hasCheckedStorage,
    persistedUser,
    setPersistedUser,
  } = useToken();
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentUser = useQuery(api.user.getCurrentUser, {});
  const invalidTokenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Initialise from AsyncStorage cache so profile is visible immediately.
  // This is provisional until Convex confirms the JWT is valid.
  useEffect(() => {
    if (hasCheckedStorage) {
      if (persistedUser && rawToken) {
        setUserState(persistedUser);
      }
      setIsLoading(false);
    }
  }, [hasCheckedStorage, persistedUser, rawToken]);

  // Reconcile local auth state with backend identity.
  // Do not clear token immediately on null to avoid race conditions on web/mobile
  // while Convex auth headers are being refreshed after signin/signup.
  useEffect(() => {
    if (!hasCheckedStorage) return;

    if (!rawToken) {
      if (invalidTokenTimerRef.current) {
        clearTimeout(invalidTokenTimerRef.current);
        invalidTokenTimerRef.current = null;
      }
      setUserState(null);
      setIsLoading(false);
      return;
    }

    if (currentUser === undefined) {
      setIsLoading(true);
      return;
    }

    if (currentUser === null) {
      if (!invalidTokenTimerRef.current) {
        invalidTokenTimerRef.current = setTimeout(() => {
          void setRawToken(null);
          invalidTokenTimerRef.current = null;
        }, 1500);
      }
      setUserState(null);
      setIsLoading(false);
      return;
    }

    if (invalidTokenTimerRef.current) {
      clearTimeout(invalidTokenTimerRef.current);
      invalidTokenTimerRef.current = null;
    }

    setUserState(currentUser as User);
    setIsLoading(false);
  }, [hasCheckedStorage, rawToken, currentUser, setRawToken]);

  useEffect(() => {
    return () => {
      if (invalidTokenTimerRef.current) {
        clearTimeout(invalidTokenTimerRef.current);
        invalidTokenTimerRef.current = null;
      }
    };
  }, []);

  const setUser = (u: User | null) => {
    setUserState(u);
    setPersistedUser(u);
  };

  const signinMutation = useMutation(api.user.signin);
  const signupMutation = useMutation(api.user.signup);

  const signin = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const result = await signinMutation({ email, password });
      await setRawToken(result.token);
      setUser(result.user as User);
    } catch (error) {
      console.error("Signin error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    phone: string,
    className: string,
    image?: string,
    memohackStudent?: boolean,
  ) => {
    try {
      setIsLoading(true);
      const result = await signupMutation({
        email,
        password,
        name,
        phone,
        class: className,
        image,
        memohackStudent: memohackStudent ?? false,
      });
      await setRawToken(result.token);
      setUser(result.user as User);
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signout = async () => {
    try {
      await setRawToken(null);
      setUserState(null);
    } catch (error) {
      console.error("Signout error:", error);
    }
  };

  const getCurrentUser = async () => {
    // User data is restored from AsyncStorage on app start
  };

  const value: AppContextType = {
    user,
    setUser,
    isLoading,
    isAuthenticated: rawToken !== null,
    token: rawToken,
    signin,
    signup,
    signout,
    getCurrentUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Keep the old AppProvider name as an alias for backward compatibility
// (used in auth screens and tab components via useApp)
// Note: components that call useApp() must be inside UserProvider.

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
