import { useState, useEffect, useCallback } from "react";
import {
  SignUp,
  SignIn,
  SignOut,
  checkAuth,
  getCurrentUser,
  refreshToken,
} from "../api/authApi";
import { ISignUp, ISignIn } from "../api/authApi.types";

interface IAuthUser {
  id: string;
  username: string;
  email: string;
}

interface IAuthState {
  isAuthenticated: boolean;
  user: IAuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

interface IUseAuthReturn extends IAuthState {
  signUp: (userData: ISignUp) => Promise<void>;
  signIn: (userData: ISignIn) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = (): IUseAuthReturn => {
  const [state, setState] = useState<IAuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = useCallback(async () => {
    try {
      const authData = checkAuth();

      if (authData.isAuthenticated && authData.token) {
        const userData = await getCurrentUser();

        setState({
          isAuthenticated: true,
          user: userData,
          token: authData.token,
          isLoading: false,
          error: null,
        });
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Ошибка инициализации аутентификации",
      }));
    }
  }, []);

  const handleAuthSuccess = useCallback((data: any) => {
    const user =
      data.user || JSON.parse(localStorage.getItem("user") || "null");
    const token = data.access_token || localStorage.getItem("access_token");

    setState({
      isAuthenticated: true,
      user,
      token,
      isLoading: false,
      error: null,
    });
  }, []);

  const signUp = useCallback(
    async (userData: ISignUp) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await SignUp(userData);
        handleAuthSuccess(data);
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Ошибка регистрации";
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [handleAuthSuccess]
  );

  const signIn = useCallback(
    async (userData: ISignIn) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await SignIn(userData);
        handleAuthSuccess(data);
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || "Ошибка входа";
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [handleAuthSuccess]
  );

  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      await SignOut();
      setState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Ошибка выхода",
      }));
      throw error;
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await refreshToken();
      handleAuthSuccess(data);
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Сессия истекла. Пожалуйста, войдите снова.",
      }));
      throw error;
    }
  }, [handleAuthSuccess]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    refreshAuth,
    clearError,
  };
};

export const useRequireAuth = (redirectTo = "/login") => {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      window.location.href = redirectTo;
    }
  }, [auth.isAuthenticated, auth.isLoading, redirectTo]);

  return auth;
};
