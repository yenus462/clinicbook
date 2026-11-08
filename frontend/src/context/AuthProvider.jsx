import { useState, useEffect, useCallback, useMemo } from "react";
import { AuthContext } from "./authContext";
import { loginRequest, registerRequest, meRequest } from "../api/auth";
import { getToken, setToken, clearToken, setUnauthorizedHandler } from "../api/client";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // If a token is stored, we must check it before knowing who the user is
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  // If any later request gets a 401, end the session
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearToken();
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // On first load: restore the session from the stored token
  useEffect(() => {
    if (!getToken()) return;

    let cancelled = false;
    meRequest()
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) clearToken();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await loginRequest(email, password);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, phone, password) => {
    const data = await registerRequest(name, email, phone, password);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}