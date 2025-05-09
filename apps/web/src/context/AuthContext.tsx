"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiClient } from "@/lib/api/client";

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

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to get current user with existing credentials (cookies)
        const userData = await apiClient("auth/me", {
          method: "GET",
          requireAuth: true,
        });

        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          customerId: userData.customerId,
        });
      } catch (err) {
        // Not authenticated, that's okay
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient("auth/login", {
        method: "POST",
        body: credentials,
      });

      // No need to store token in localStorage - it's in HTTP-only cookies
      setUser({
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role,
        customerId: response.user.customerId,
      });
    } catch (err) {
      setError("Invalid email or password");
      throw err;
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

      // No need to store token in localStorage - it's in HTTP-only cookies
      setUser({
        id: loginResponse.user.id,
        email: loginResponse.user.email,
        name: loginResponse.user.name,
        role: loginResponse.user.role,
        customerId: loginResponse.user.customerId,
      });
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
        method: "POST",
      });

      // No need to remove from localStorage
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
      value={{ user, isLoading, error, login, register, logout, clearError }}
    >
      {children}
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
