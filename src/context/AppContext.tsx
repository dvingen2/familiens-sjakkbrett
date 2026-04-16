import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  ensureProfile,
  getAuthState,
  isUsingSupabase,
  listProfiles,
  registerFamily,
  signInFamily,
  signIn,
  signOut,
  signUp,
  subscribeToAuth,
} from "../lib/appClient";
import { getProfiles as getLocalProfiles } from "../lib/storage";
import type { Profile } from "../types";

interface AppContextValue {
  isLoading: boolean;
  isSupabaseMode: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  profiles: Profile[];
  refreshProfiles: () => Promise<void>;
  signInFamilyProfile: (displayName: string, pin: string) => Promise<{ error?: string }>;
  registerFamilyProfile: (displayName: string, pin: string) => Promise<{ error?: string }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithPassword: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{ error?: string }>;
  signOutCurrentUser: () => Promise<{ error?: string }>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  async function refreshProfiles() {
    const nextProfiles = await listProfiles();
    startTransition(() => {
      setProfiles(nextProfiles);
    });
  }

  async function syncUser(nextSession: Session | null, nextUser: User | null) {
    setSession(nextSession);
    setUser(nextUser);

    if (!nextUser) {
      setProfile(null);
      await refreshProfiles();
      setIsLoading(false);
      return;
    }

    if (!nextSession) {
      const localProfile =
        getLocalProfiles().find((item) => item.id === nextUser.id) ?? null;
      setProfile(localProfile);
      await refreshProfiles();
      setIsLoading(false);
      return;
    }

    const ensuredProfile = await ensureProfile(nextUser);
    setProfile(ensuredProfile);
    await refreshProfiles();
    setIsLoading(false);
  }

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const auth = await getAuthState();
      if (!mounted) return;
      await syncUser(auth.session, auth.user);
    })();

    const unsubscribe = subscribeToAuth((nextSession, nextUser) => {
      void syncUser(nextSession, nextUser);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      isLoading,
      isSupabaseMode: isUsingSupabase(),
      session,
      user,
      profile,
      profiles,
      refreshProfiles,
      signInFamilyProfile: (displayName, pin) => signInFamily(displayName, pin),
      registerFamilyProfile: (displayName, pin) => registerFamily(displayName, pin),
      signInWithPassword: (email, password) => signIn({ email, password }),
      signUpWithPassword: (email, password, displayName) =>
        signUp({ email, password, displayName }),
      signOutCurrentUser: () => signOut(),
    }),
    [isLoading, profile, profiles, session, user],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error("useAppContext must be used inside AppProvider");
  }
  return value;
}
