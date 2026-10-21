"use client";

import { useState, useEffect, useCallback } from "react";
import { User, StudentProfile } from "@/types";
import { api } from "@/lib/api";
import { DEMO_PROFILE, DEMO_SESSION_KEY, DEMO_USER } from "@/lib/demo-auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isDemo, setIsDemo] = useState<boolean>(false);

  const checkAuth = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(DEMO_SESSION_KEY) === "true") {
      setUser(DEMO_USER);
      setProfile(DEMO_PROFILE);
      setIsAuthenticated(true);
      setIsDemo(true);
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("eduai_token");
    if (!token) {
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      setIsDemo(false);
      setLoading(false);
      return;
    }

    try {
      const res = await api.auth.me();
      setUser(res.user);
      setProfile(res.profile);
      setIsAuthenticated(true);
      setIsDemo(false);
    } catch {
      api.auth.logout();
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      setIsDemo(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      window.sessionStorage.removeItem(DEMO_SESSION_KEY);
      const res = await api.auth.login({ email, password: pass });
      setUser(res.user);
      setProfile(res.profile ?? null);
      setIsAuthenticated(true);
      setIsDemo(false);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    full_name: string;
    education_level?: string;
    course?: string;
    year?: number;
    primary_interest?: string;
    career_goal?: string;
  }) => {
    setLoading(true);
    try {
      window.sessionStorage.removeItem(DEMO_SESSION_KEY);
      const res = await api.auth.register(data);
      setUser(res.user);
      setProfile(res.profile ?? null);
      setIsAuthenticated(true);
      setIsDemo(false);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.auth.logout();
    window.sessionStorage.removeItem(DEMO_SESSION_KEY);
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
    setIsDemo(false);
  };

  const startOfflineDemo = () => {
    if (typeof window === "undefined") return;
    api.auth.logout();
    window.sessionStorage.setItem(DEMO_SESSION_KEY, "true");
    setUser(DEMO_USER);
    setProfile(DEMO_PROFILE);
    setIsAuthenticated(true);
    setIsDemo(true);
    setLoading(false);
  };

  return {
    user,
    profile,
    loading,
    isAuthenticated,
    isDemo,
    login,
    register,
    startOfflineDemo,
    logout,
    refreshUser: checkAuth,
  };
}
