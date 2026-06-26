"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAccessToken } from "@/lib/storage/auth";
import {
  getMe,
  loginWithGoogle as startGoogleLogin,
  logout as clearAuthSession,
} from "@/lib/auth/session";
import type { AuthenticatedUser } from "@/types/api";

export type AuthStatus = "checking" | "authenticated" | "unauthenticated";

export function useAuth() {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const checkSession = useCallback(() => {
    controllerRef.current?.abort();

    if (!getAccessToken()) {
      setUser(null);
      setStatus("unauthenticated");
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus("checking");

    getMe(controller.signal)
      .then((nextUser) => {
        if (controller.signal.aborted) return;
        setUser(nextUser);
        setStatus("authenticated");
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        clearAuthSession();
        setUser(null);
        setStatus("unauthenticated");
      });
  }, []);

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
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  return {
    status,
    user,
    isAuthenticated: status === "authenticated",
    checkSession,
    loginWithGoogle: startGoogleLogin,
    logout,
  };
}
