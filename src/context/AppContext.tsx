import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  getAuthState,
  isUsingSupabase,
  listProfiles,
  registerWithUsernamePin,
  signInWithUsernamePin,
  signOut,
  subscribeToAuth,
} from "../lib/appClient";
import type { AppSession, Profile } from "../types";

interface AppContextValue {
  isLoading: boolean;
  isSupabaseMode: boolean;
  session: AppSession | null;
  profile: Profile | null;
  profiles: Profile[];
  refreshProfiles: () => Promise<void>;
  signInWithUsernamePin: (username: string, pin: string) => Promise<{ error?: string }>;
  registerWithUsernamePin: (username: string, pin: string) => Promise<{ error?: string }>;
  signOutCurrentUser: () => Promise<{ error?: string }>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<AppSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  async function refreshProfiles() {
    const nextProfiles = await listProfiles();
    startTransition(() => {
      setProfiles(nextProfiles);
    });
  }

  async function syncAuth() {
    const auth = await getAuthState();
    setSession(auth.session);
    setProfile(auth.profile);
    await refreshProfiles();
    setIsLoading(false);
  }

  useEffect(() => {
    let mounted = true;

    void (async () => {
      await syncAuth();
      if (!mounted) {
        return;
      }
    })();

    const unsubscribe = subscribeToAuth((nextAuth) => {
      startTransition(() => {
        setSession(nextAuth.session);
        setProfile(nextAuth.profile);
      });
      void refreshProfiles();
      setIsLoading(false);
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
      profile,
      profiles,
      refreshProfiles,
      signInWithUsernamePin,
      registerWithUsernamePin,
      signOutCurrentUser: () => signOut(),
    }),
    [isLoading, profile, profiles, session],
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
