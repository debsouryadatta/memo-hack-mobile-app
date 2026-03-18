import { api } from "@memo-hack/convex";
import { useMutation, useQuery } from "convex/react";
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";

// ---------------------------------------------------------------------------
// TokenContext — lightweight, lives OUTSIDE ConvexProviderWithAuth so it can
// supply the JWT to fetchAccessToken without a circular dependency.
// ---------------------------------------------------------------------------

interface TokenContextType {
  rawToken: string | null;
  setRawToken: (token: string | null) => void;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export function TokenProvider({ children }: { children: ReactNode }) {
  const [rawToken, setRawTokenState] = useState<string | null>(() =>
    sessionStorage.getItem("admin_auth_token"),
  );

  const setRawToken = (token: string | null) => {
    setRawTokenState(token);
    if (token) {
      // C-3 fix: sessionStorage (not localStorage) — invisible to other tabs,
      // cleared when the browser tab closes, never persisted to disk.
      sessionStorage.setItem("admin_auth_token", token);
    } else {
      sessionStorage.removeItem("admin_auth_token");
    }
  };

  return (
    <TokenContext.Provider value={{ rawToken, setRawToken }}>
      {children}
    </TokenContext.Provider>
  );
}

function useToken() {
  const ctx = useContext(TokenContext);
  if (!ctx) throw new Error("useToken must be used within TokenProvider");
  return ctx;
}

/**
 * Used by ConvexProviderWithAuth to inject the JWT into the Convex auth header.
 * The token is read from TokenContext — it is NEVER passed as a function arg,
 * so it will not appear in Convex dashboard logs (fixes C-2).
 */
export function useAuthForConvex() {
  const { rawToken } = useToken();
  const tokenRef = useRef(rawToken);
  tokenRef.current = rawToken;

  const fetchAccessToken = useCallback(async () => {
    return tokenRef.current;
  }, []);

  return {
    // isLoading: false — token is synchronously read from sessionStorage on
    // first render, so there's no async loading phase needed here.
    isLoading: false,
    isAuthenticated: rawToken !== null,
    fetchAccessToken,
  };
}

// ---------------------------------------------------------------------------
// AuthContext — lives INSIDE ConvexProviderWithAuth, can use Convex hooks.
// ---------------------------------------------------------------------------

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

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  signin: (email: string, password: string) => Promise<void>;
  signout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { rawToken, setRawToken } = useToken();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(rawToken !== null);

  const signinMutation = useMutation(api.user.signin);
  // getCurrentUser now takes no args — auth flows via header (C-2 fix)
  const getCurrentUserQuery = useQuery(
    api.user.getCurrentUser,
    rawToken ? {} : "skip",
  );

  useEffect(() => {
    if (!rawToken) {
      setIsLoading(false);
      return;
    }

    if (getCurrentUserQuery !== undefined) {
      if (getCurrentUserQuery) {
        if (getCurrentUserQuery.admin === true) {
          setUser(getCurrentUserQuery as User);
        } else {
          // Logged in but not admin — force sign-out
          signout();
        }
      } else {
        signout();
      }
      setIsLoading(false);
    }
  }, [getCurrentUserQuery, rawToken]);

  const signin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await signinMutation({ email, password });
      if (!result.user.admin) {
        throw new Error("Access denied. Admin privileges required.");
      }
      setRawToken(result.token);
      setUser(result.user as User);
    } finally {
      setIsLoading(false);
    }
  };

  const signout = () => {
    setRawToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        token: rawToken,
        signin,
        signout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
