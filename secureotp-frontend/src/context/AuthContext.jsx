
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { logoutRequest } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    () => sessionStorage.getItem("accessToken")
  );

  const [user, setUser] = useState(() => {
  try {
    const savedUser = sessionStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    sessionStorage.removeItem("user");
    return null;
  }
});

  const isAuthenticated = Boolean(token);

  // Keep React state synchronized with automatic token refresh.
  useEffect(() => {
    const handleTokenUpdate = () => {
      setToken(sessionStorage.getItem("accessToken"));
    };

    const handleSessionExpired = () => {
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("user");

      setToken(null);
      setUser(null);
    };

    window.addEventListener(
      "secureotp:token-updated",
      handleTokenUpdate
    );

    window.addEventListener(
      "secureotp:session-expired",
      handleSessionExpired
    );

    return () => {
      window.removeEventListener(
        "secureotp:token-updated",
        handleTokenUpdate
      );

      window.removeEventListener(
        "secureotp:session-expired",
        handleSessionExpired
      );
    };
  }, []);

  // Store login details after successful authentication.
  const login = (accessToken, email) => {
    sessionStorage.setItem("accessToken", accessToken);
    sessionStorage.setItem("user", JSON.stringify({ email }));

    setToken(accessToken);
    setUser({ email });
  };

  // Revoke the server refresh token and clear local authentication.
  const logout = async () => {
    try {
      await logoutRequest();
    } catch (error) {
      console.error(
        "Server logout could not be completed:",
        error.response?.status || error.message
      );
    } finally {
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("user");

      setToken(null);
      setUser(null);
    }
  };

  const value = {
    token,
    user,
    isAuthenticated,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to access authentication.
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
