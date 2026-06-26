"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getAccessToken } from "@/lib/storage/auth";
import { clearStoredUserId, setStoredUserId } from "@/lib/storage/user";
import { setGachaUser } from "@/lib/gacha/store";
import { setCarbonUser } from "@/lib/carbon/carbonReward";
import {
  getMe,
  loginWithGoogle as startGoogleLogin,
  logout as clearAuthSession,
} from "@/lib/auth/session";
import type { AuthenticatedUser } from "@/types/api";

export type AuthStatus = "checking" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  checkSession: () => Promise<AuthenticatedUser | null>;
  refetchMe: () => Promise<AuthenticatedUser | null>;
  setUser: (user: AuthenticatedUser | null) => void;
  loginWithGoogle: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getAuthenticatedUserId(user: AuthenticatedUser): string | null {
  const id = user.user_id ?? user.id;
  return id === undefined || id === null ? null : String(id);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const storeUser = useCallback((nextUser: AuthenticatedUser | null) => {
    if (!nextUser) {
      // 로그아웃/세션 없음 → 게이미피케이션 저장소를 게스트 범위로 되돌린다.
      setGachaUser(null);
      setCarbonUser(null);
      setUser(null);
      return;
    }
    const userId = getAuthenticatedUserId(nextUser);
    if (userId) setStoredUserId(userId);
    // 뽑기/탄소보상(캐릭터 컬렉션 포함) 저장소를 이 DB 계정 범위로 전환한다.
    setGachaUser(userId);
    setCarbonUser(userId);
    setUser(nextUser);
  }, []);

  const checkSession = useCallback(async () => {
    controllerRef.current?.abort();

    if (!getAccessToken()) {
      storeUser(null);
      setStatus("unauthenticated");
      return null;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus("checking");

    try {
      const nextUser = await getMe(controller.signal);
      if (controller.signal.aborted) return null;
      storeUser(nextUser);
      setStatus("authenticated");
      return nextUser;
    } catch {
      if (controller.signal.aborted) return null;
      clearAuthSession();
      clearStoredUserId();
      storeUser(null);
      setStatus("unauthenticated");
      return null;
    }
  }, [storeUser]);

  const refetchMe = useCallback(async () => {
    if (!getAccessToken()) {
      storeUser(null);
      setStatus("unauthenticated");
      return null;
    }

    const controller = new AbortController();
    try {
      const nextUser = await getMe(controller.signal);
      storeUser(nextUser);
      setStatus("authenticated");
      return nextUser;
    } catch {
      clearAuthSession();
      clearStoredUserId();
      storeUser(null);
      setStatus("unauthenticated");
      return null;
    }
  }, [storeUser]);

  useEffect(() => {
    const timer = window.setTimeout(checkSession, 0);
    return () => {
      window.clearTimeout(timer);
      controllerRef.current?.abort();
    };
  }, [checkSession]);

  const logout = useCallback(() => {
    controllerRef.current?.abort();
    clearAuthSession();
    clearStoredUserId();
    storeUser(null);
    setStatus("unauthenticated");
  }, [storeUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      isAuthenticated: status === "authenticated",
      checkSession,
      refetchMe,
      setUser: storeUser,
      loginWithGoogle: startGoogleLogin,
      logout,
    }),
    [checkSession, logout, refetchMe, status, storeUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
