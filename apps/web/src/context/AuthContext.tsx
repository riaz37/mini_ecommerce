"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiClient } from "@/lib/api/client";

// Create a context for cart merge triggering
const CartMergeContext = createContext<
  { triggerMerge: () => void } | undefined
>(undefined);

export function useCartMerge() {
  return useContext(CartMergeContext);
}

type User = {
  id: string;
  email: string;
  name?: string;
  role?: string;
  customerId?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [cartMergeTrigger, setCartMergeTrigger] = useState<(() => void) | null>(
    null
  );

  // Function to set auth token in memory
  const handleSetAuthToken = (token: string | null) => {
    // Store token in memory only, not in localStorage for security
    // This is used for backward compatibility
    console.log(`Auth token ${token ? 'set' : 'cleared'}`);
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking authentication status...");
        // Try to refresh the token on initial load
        const refreshed = await refreshToken();

        if (!refreshed) {
          console.log("Token refresh failed, user not authenticated");
          setUser(null);
          setIsLoading(false);
          return;
        }

        console.log("Token refreshed successfully, fetching user data");
        // If refresh successful, get user data
        const userData = await apiClient("auth/me", {
          requireAuth: true,
        });

        console.log("User data retrieved:", userData);
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          customerId: userData.customerId,
        });
      } catch (err) {
        console.error("Failed to check auth:", err);
        setAuthToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Function to refresh the access token
  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/auth/refresh`,
        {
          method: "POST",
          credentials: "include", // Include cookies
        }
      );

      if (!response.ok) return false;

      const data = await response.json();
      setAuthToken(data.access_token);
      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient("/auth/login", {
        method: "POST",
        body: credentials,
      });

      // No need to store token in memory as it's in cookies now
      // But we'll keep this for backward compatibility
      if (response.access_token) {
        handleSetAuthToken(response.access_token);
      }

      // Set user in state
      setUser(response.user);

      // Trigger cart merge if function is available
      // Use setTimeout to ensure auth is complete before merging
      if (typeof cartMergeTrigger === "function") {
        console.log("Triggering cart merge after login");
        setTimeout(() => cartMergeTrigger(), 500); // Increased delay to ensure auth is complete
      } else {
        console.warn("Cart merge function not available");
      }

      return response;
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient("auth/register", {
        method: "POST",
        body: userData,
      });

      // After registration, log the user in
      const loginResponse = await apiClient("auth/login", {
        method: "POST",
        body: {
          email: userData.email,
          password: userData.password,
        },
      });

      // Store token in memory (not localStorage)
      setAuthToken(loginResponse.access_token);

      setUser(loginResponse.user);
    } catch (err) {
      setError("Registration failed. Please try again.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiClient("auth/logout", {
        method: "POST", // Explicitly set method to POST
      });

      // Clear token from memory (for backward compatibility)
      setAuthToken(null);

      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        isLoading, 
        error, 
        login, 
        register, 
        logout, 
        clearError 
      }}
    >
      <CartMergeContext.Provider
        value={{ 
          triggerMerge: cartMergeTrigger || (() => {
            console.warn("Cart merge function called but not initialized");
          }) 
        }}
      >
        {children}
      </CartMergeContext.Provider>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
