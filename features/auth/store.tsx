"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export interface UserProfile {
  id: string;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  disabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string | null;
}

interface AuthStore {
  user: AuthUser | null;
  profile: UserProfile | null;
  isGuest: boolean;
  hasPassword: boolean;
  loading: boolean;
  sessionVersion: number;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthStore | null>(null);

function computeHasPassword(u: {
  identities?: { provider: string }[] | null;
  app_metadata?: { providers?: string[] | null };
} | null): boolean {
  if (!u) return false;
  const providers = u.identities?.map((i) => i.provider) ??
    u.app_metadata?.providers ?? [];
  return providers.includes("email");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // Bumped on every auth change (login / logout / switch account) so that
  // downstream providers and components can wipe + refetch identity-scoped
  // state. This is the single signal that the "current person" changed.
  const [sessionVersion, setSessionVersion] = useState(0);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (data) setProfile(data as UserProfile);
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const u = data.user;
      if (u) {
        setUser({ id: u.id, email: u.email ?? null });
        setHasPassword(computeHasPassword(u));
        fetchProfile(u.id);
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      if (u) {
        setUser({ id: u.id, email: u.email ?? null });
        setHasPassword(computeHasPassword(u));
        fetchProfile(u.id);
      } else {
        setUser(null);
        setProfile(null);
        setHasPassword(false);
      }
      // A different identity is now active: bump the version so every
      // identity-scoped provider/component resets, and re-render Server
      // Components under the new requester.
      setSessionVersion((v) => v + 1);
      router.refresh();
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [fetchProfile, router]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const value = useMemo<AuthStore>(
    () => ({
      user,
      profile,
      isGuest: !user,
      hasPassword,
      loading,
      sessionVersion,
      refreshProfile,
    }),
    [user, profile, hasPassword, loading, sessionVersion, refreshProfile],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}

export function useSessionVersion() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSessionVersion must be used within AuthProvider");
  return v.sessionVersion;
}
