import { api } from "@memo-hack/convex";
import { useMutation, useQuery } from "convex/react";
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);

  const signinMutation = useMutation(api.user.signin);
  const getCurrentUserQuery = useQuery(
    api.user.getCurrentUser,
    token ? { token } : "skip",
  );

  useEffect(() => {
    const storedToken = localStorage.getItem("admin_auth_token");
    setHasCheckedStorage(true);
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  useEffect(() => {
    if (!hasCheckedStorage) return;

    if (token) {
      if (getCurrentUserQuery !== undefined) {
        if (getCurrentUserQuery) {
          // Only allow admin users
          if (getCurrentUserQuery.admin === true) {
            setUser(getCurrentUserQuery as User);
          } else {
            // Not an admin — sign them out
            signout();
          }
        } else {
          signout();
        }
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [getCurrentUserQuery, token, hasCheckedStorage]);

  const signin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await signinMutation({ email, password });
      if (!result.user.admin) {
        throw new Error("Access denied. Admin privileges required.");
      }
      setToken(result.token);
      setUser(result.user as User);
      localStorage.setItem("admin_auth_token", result.token);
    } finally {
      setIsLoading(false);
    }
  };

  const signout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("admin_auth_token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        token,
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
